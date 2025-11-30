namespace IELTS_PRACTICE.DTOs.Responses
{
    public class ChatConversationDTO
    {
        public int StudentId { get; set; }
        public string StudentName { get; set; }
        public string StudentEmail { get; set; }
        public int UnreadCount { get; set; }
        public ChatMessageDTO? LastMessage { get; set; }
    }
}
