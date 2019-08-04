import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Appointments from '../models/Appointments';
import User from '../models/User';
import File from '../models/File';
import Notification from '../schemas/Notification';

class AppointsmentsController {
  async index(req, res) {
    const { page } = req.query;

    const appointments = await Appointments.findAll({
      where: {
        user_id: req.userId,
        canceled_at: null,
      },
      order: ['date'],
      limit: 20,
      offset: (page - 1) * 20,
      attributes: ['id', 'date'],
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return res.json(appointments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(401).json({
        error: 'Validation Fails',
      });
    }

    const { provider_id, date } = req.body;

    /**
     * Check if provider_id is a provider
     */

    const isProvider = await User.findOne({
      where: {
        id: provider_id,
        provider: true,
      },
    });

    if (!isProvider) {
      return res.status(401).json({
        error: 'You can only create appointments with providers',
      });
    }

    /**
     * Check for past dates
     */
    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      return res.status(401).json({
        error: 'Past date are not permited',
      });
    }

    /**
     * Check date availability
     */
    const checkAvailability = await Appointments.findOne({
      where: { provider_id, canceled_at: null, date: hourStart },
    });

    if (checkAvailability) {
      return res.status(401).json({
        error: 'Appoint date is not availability',
      });
    }

    if (provider_id === req.userId) {
      return res.status(401).json({
        error: 'Not permited creating appointment same user',
      });
    }

    const appointments = await Appointments.create({
      user_id: req.userId,
      provider_id,
      date,
    });

    /**
     * Notify Proviver Mongo
     */

    const user = await User.findByPk(req.userId);
    const formattedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', às'  H:mm'h'",
      { locale: pt }
    );

    await Notification.create({
      content: `Novo agendamento de ${user.name} Garcia para ${formattedDate}`,
      user: provider_id,
    });

    return res.json(appointments);
  }

  async delete(req, res) {
    const appointmentsToDelete = await Appointments.findByPk(req.params.id);

    if (appointmentsToDelete.user_id !== req.userId) {
      return res.status(401).json({
        error: "You don't have permission to calcel this appointments.",
      });
    }

    const dateWithSub = subHours(appointmentsToDelete.date, 2);

    if (isBefore(dateWithSub, new Date())) {
      return res.status(401).json({
        error: 'You can only cancel appointments 2 hours in advanced',
      });
    }

    appointmentsToDelete.canceled_at = new Date();

    await appointmentsToDelete.save();

    return res.json(appointmentsToDelete);
  }

  async show(req, res) {
    const appointmentsToShow = await Appointments.findByPk(req.params.id);

    return res.json(appointmentsToShow);
  }
}

export default new AppointsmentsController();
