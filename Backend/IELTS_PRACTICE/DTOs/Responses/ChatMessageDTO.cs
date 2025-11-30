namespace IELTS_PRACTICE.DTOs.Responses
{
    public class ChatMessageDTO
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public string StudentName { get; set; }
        public int? AdminId { get; set; }
        public string? AdminName { get; set; }
        public string Message { get; set; }
        public string SentBy { get; set; } // "Student" or "Admin"
        public DateTime CreatedAt { get; set; }
        public bool IsRead { get; set; }
    }
}
