import { startOfHour, parseISO, isBefore, format } from 'date-fns';
import pt from 'date-fns/locale/pt';
import User from '../models/User';
import Appointments from '../models/Appointments';
import Notification from '../schemas/Notification';

class CreateAppointmentService {
  async run({ provider_id, user_id, date }) {
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
      throw new Error('You can only create appointments with providers');
    }

    /**
     * Check for past dates
     */
    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      throw new Error('Past date are not permited');
    }

    /**
     * Check date availability
     */
    const checkAvailability = await Appointments.findOne({
      where: { provider_id, canceled_at: null, date: hourStart },
    });

    if (checkAvailability) {
      throw new Error('Appoint date is not availability');
    }

    if (provider_id === user_id) {
      throw new Error('Not permited creating appointment same user');
    }

    const appointments = await Appointments.create({
      user_id,
      provider_id,
      date,
    });

    /**
     * Notify Proviver Mongo
     */

    const user = await User.findByPk(user_id);
    const formattedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', às'  H:mm'h'",
      { locale: pt }
    );

    await Notification.create({
      content: `Novo agendamento de ${user.name} Garcia para ${formattedDate}`,
      user: provider_id,
    });

    return appointments;
  }
}

export default new CreateAppointmentService();
