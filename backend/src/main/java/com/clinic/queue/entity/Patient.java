
import com.clinic.queue.entity.Appointment;
import com.clinic.queue.entity.MedicalRecord;
import com.clinic.queue.entity.QueueEntry;

public class Patient {
    private UUID userId;
    private String name;
    private String email;
    private String contact;
    private String password;
    private List<MedicalRecord> medicalRecords;
    private List<Appointment> appointments;
    private List<QueueEntry> queueEntries;

    // Getters and setters
}
