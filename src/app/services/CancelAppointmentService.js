import { isBefore, subHours } from 'date-fns';
import User from '../models/User';
import Appointments from '../models/Appointments';
import Queue from '../../lib/Queue';
import CancellationMail from '../../jobs/CancellationMail';

class CancelAppointmentService {
  async run({ provider_id, user_id }) {
    const appointment = await Appointments.findByPk(provider_id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    if (appointment.user_id !== user_id) {
      throw new Error("You don't have permission to calcel this appointments.");
    }

    const dateWithSub = subHours(appointment.date, 2);

    if (isBefore(dateWithSub, new Date())) {
      throw new Error('You can only cancel appointments 2 hours in advanced');
    }

    appointment.canceled_at = new Date();

    await appointment.save();

    await Queue.add(CancellationMail.key, {
      appointment,
    });
  }
}

export default new CancelAppointmentService();
