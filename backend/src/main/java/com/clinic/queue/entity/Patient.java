package com.clinic.queue.entity;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.cglib.core.Local;

public class Patient {
    private final List<MedicalRecord> medicalRecords = new ArrayList<>();
    private final List<Appointment> appointments = new ArrayList<>();
    private final List<QueueEntry> queueEntries = new ArrayList<>();

    // public Appointment bookAppointment(String doctorId, String clinicId, LocalDateTime dateTime) {
    //     Appointment newAppt = new Appointment(doctorId, clinicId, dateTime); // to change according to appointment constructor
    //     appointments.add(newAppt);
    //     return newAppt;
    // }

    // public boolean cancelAppointment(String appointmentId) {
    //     /*
    //      * Optional<Appointment> opt = findAppointment(appointmentId);
    //      * if (opt.isEmpty()) {
    //      *      return false
    //      * }
    //      * Appointment a = opt.get();
    //      * if (a.status == AppointmentStatus.CANCELLED) return false;
    //      * a.status = AppointmentStatus.CANCELLED;
    //      * 
    //      * return true;
    //      */
    // }

    // public boolean rescheduleAppointment(String appointmentId, LocalDateTime newDateTime) {

    //     // TODO: implement a findAppointment function in Appointment class that looks through the appointment list for an ID

    //     // Optional<Appointment> opt = findAppointment(appointmentId); -> finds appointment by ID 
    //     // if (opt.isEmpty()) return false;

    //     // Appointment a = opt.get();
    //     // if (a.getStatus() == Appointment.Status.CANCELLED) return false;

    //     // a.setDateTime(newDateTime);
    //     // a.setStatus(Appointment.Status.RESCHEDULED);
    // }

    // public QueueEntry checkIn(String appointmentId) {
    //     // prevent duplicated entries
    //     for (QueueEntry qe : queueEntries) {
    //         if (qe.getAppointmentId() == appointmentId && qe.getStatus() == QueueStatus.WAITING) {
    //             return qe;
    //         }
    //     }
    // }  


}
