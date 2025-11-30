using IELTS_PRACTICE.Contexts;
using IELTS_PRACTICE.DTOs.Requests;
using IELTS_PRACTICE.DTOs.Responses;
using IELTS_PRACTICE.Models;
using Microsoft.EntityFrameworkCore;

namespace IELTS_PRACTICE.Services
{
    public class SupportChatService
    {
        private readonly AppDbContext _context;

        public SupportChatService(AppDbContext context)
        {
            _context = context;
        }

        // Student sends a message
        public async Task<ChatMessageDTO> SendMessageFromStudent(int studentId, SendMessageDTO messageDto)
        {
            var student = await _context.Users.FindAsync(studentId);
            if (student == null || student.Role != "Student")
            {
                throw new Exception("Invalid student");
            }

            var message = new SupportChat
            {
                StudentId = studentId,
                AdminId = null,
                Message = messageDto.Message,
                SentBy = "Student",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            _context.SupportChats.Add(message);
            await _context.SaveChangesAsync();

            return new ChatMessageDTO
            {
                Id = message.Id,
                StudentId = message.StudentId,
                StudentName = student.FullName,
                AdminId = message.AdminId,
                AdminName = null,
                Message = message.Message,
                SentBy = message.SentBy,
                CreatedAt = message.CreatedAt,
                IsRead = message.IsRead
            };
        }

        // Admin sends a reply to a student
        public async Task<ChatMessageDTO> SendMessageFromAdmin(int adminId, int studentId, SendMessageDTO messageDto)
        {
            var admin = await _context.Users.FindAsync(adminId);
            if (admin == null || admin.Role != "Admin")
            {
                throw new Exception("Invalid admin");
            }

            var student = await _context.Users.FindAsync(studentId);
            if (student == null || student.Role != "Student")
            {
                throw new Exception("Invalid student");
            }

            var message = new SupportChat
            {
                StudentId = studentId,
                AdminId = adminId,
                Message = messageDto.Message,
                SentBy = "Admin",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            _context.SupportChats.Add(message);
            await _context.SaveChangesAsync();

            return new ChatMessageDTO
            {
                Id = message.Id,
                StudentId = message.StudentId,
                StudentName = student.FullName,
                AdminId = message.AdminId,
                AdminName = admin.FullName,
                Message = message.Message,
                SentBy = message.SentBy,
                CreatedAt = message.CreatedAt,
                IsRead = message.IsRead
            };
        }

        // Get all conversations for admin (grouped by student)
        public async Task<List<ChatConversationDTO>> GetAllConversations()
        {
            var allChats = await _context.SupportChats
                .Include(sc => sc.Student)
                .Include(sc => sc.Admin)
                .ToListAsync();

            var conversations = allChats
                .GroupBy(sc => sc.StudentId)
                .Select(g => new ChatConversationDTO
                {
                    StudentId = g.Key,
                    StudentName = g.First().Student.FullName,
                    StudentEmail = g.First().Student.Email,
                    UnreadCount = g.Count(m => !m.IsRead && m.SentBy == "Student"),
                    LastMessage = g.OrderByDescending(m => m.CreatedAt)
                        .Select(m => new ChatMessageDTO
                        {
                            Id = m.Id,
                            StudentId = m.StudentId,
                            StudentName = m.Student.FullName,
                            AdminId = m.AdminId,
                            AdminName = m.Admin != null ? m.Admin.FullName : null,
                            Message = m.Message,
                            SentBy = m.SentBy,
                            CreatedAt = m.CreatedAt,
                            IsRead = m.IsRead
                        })
                        .FirstOrDefault()
                })
                .OrderByDescending(c => c.LastMessage != null ? c.LastMessage.CreatedAt : DateTime.MinValue)
                .ToList();

            return conversations;
        }

        // Get messages for a specific student (for both student and admin view)
        public async Task<List<ChatMessageDTO>> GetMessagesByStudent(int studentId)
        {
            var messages = await _context.SupportChats
                .Include(sc => sc.Student)
                .Include(sc => sc.Admin)
                .Where(sc => sc.StudentId == studentId)
                .OrderBy(sc => sc.CreatedAt)
                .Select(sc => new ChatMessageDTO
                {
                    Id = sc.Id,
                    StudentId = sc.StudentId,
                    StudentName = sc.Student.FullName,
                    AdminId = sc.AdminId,
                    AdminName = sc.Admin != null ? sc.Admin.FullName : null,
                    Message = sc.Message,
                    SentBy = sc.SentBy,
                    CreatedAt = sc.CreatedAt,
                    IsRead = sc.IsRead
                })
                .ToListAsync();

            return messages;
        }

        // Mark messages as read (when admin opens a conversation)
        public async Task MarkMessagesAsRead(int studentId, string readBy)
        {
            var messages = await _context.SupportChats
                .Where(sc => sc.StudentId == studentId && !sc.IsRead)
                .ToListAsync();

            if (readBy == "Admin")
            {
                // Mark student messages as read
                messages = messages.Where(m => m.SentBy == "Student").ToList();
            }
            else if (readBy == "Student")
            {
                // Mark admin messages as read
                messages = messages.Where(m => m.SentBy == "Admin").ToList();
            }

            foreach (var message in messages)
            {
                message.IsRead = true;
            }

            await _context.SaveChangesAsync();
        }

        // Get unread count for a student (to show notification badge)
        public async Task<int> GetUnreadCountForStudent(int studentId)
        {
            return await _context.SupportChats
                .Where(sc => sc.StudentId == studentId && !sc.IsRead && sc.SentBy == "Admin")
                .CountAsync();
        }

        // Get total unread count for admin (across all students)
        public async Task<int> GetUnreadCountForAdmin()
        {
            return await _context.SupportChats
                .Where(sc => !sc.IsRead && sc.SentBy == "Student")
                .CountAsync();
        }
    }
}
