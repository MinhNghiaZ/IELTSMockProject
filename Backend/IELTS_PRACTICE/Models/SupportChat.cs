namespace IELTS_PRACTICE.Models
{
    public class SupportChat
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public int? AdminId { get; set; }
        public string Message { get; set; }
        public string SentBy { get; set; } // "Student" or "Admin"
        public DateTime CreatedAt { get; set; }
        public bool IsRead { get; set; }
        
        // Navigation properties
        public User Student { get; set; }
        public User? Admin { get; set; }
    }
}
