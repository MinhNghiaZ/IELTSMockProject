using IELTS_PRACTICE.DTOs.Requests;
using IELTS_PRACTICE.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace IELTS_PRACTICE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SupportChatController : ControllerBase
    {
        private readonly SupportChatService _chatService;

        public SupportChatController(SupportChatService chatService)
        {
            _chatService = chatService;
        }

        private int GetCurrentUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userId ?? "0");
        }

        private string GetCurrentUserRole()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value ?? "";
        }

        // POST: api/SupportChat/send (Student sends message)
        [HttpPost("send")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> SendMessageFromStudent([FromBody] SendMessageDTO messageDto)
        {
            try
            {
                var studentId = GetCurrentUserId();
                var message = await _chatService.SendMessageFromStudent(studentId, messageDto);
                return Ok(message);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // POST: api/SupportChat/reply/{studentId} (Admin replies to student)
        [HttpPost("reply/{studentId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SendMessageFromAdmin(int studentId, [FromBody] SendMessageDTO messageDto)
        {
            try
            {
                var adminId = GetCurrentUserId();
                var message = await _chatService.SendMessageFromAdmin(adminId, studentId, messageDto);
                return Ok(message);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/SupportChat/conversations (Admin gets all conversations)
        [HttpGet("conversations")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllConversations()
        {
            try
            {
                var conversations = await _chatService.GetAllConversations();
                return Ok(conversations);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/SupportChat/messages (Student gets their own messages)
        [HttpGet("messages")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> GetMyMessages()
        {
            try
            {
                var studentId = GetCurrentUserId();
                var messages = await _chatService.GetMessagesByStudent(studentId);
                
                // Mark admin messages as read
                await _chatService.MarkMessagesAsRead(studentId, "Student");
                
                return Ok(messages);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/SupportChat/messages/{studentId} (Admin gets messages with specific student)
        [HttpGet("messages/{studentId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetMessagesByStudent(int studentId)
        {
            try
            {
                var messages = await _chatService.GetMessagesByStudent(studentId);
                
                // Mark student messages as read
                await _chatService.MarkMessagesAsRead(studentId, "Admin");
                
                return Ok(messages);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/SupportChat/unread-count (Get unread count for current user)
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            try
            {
                var role = GetCurrentUserRole();
                int count;

                if (role == "Admin")
                {
                    count = await _chatService.GetUnreadCountForAdmin();
                }
                else if (role == "Student")
                {
                    var studentId = GetCurrentUserId();
                    count = await _chatService.GetUnreadCountForStudent(studentId);
                }
                else
                {
                    return BadRequest(new { message = "Invalid user role" });
                }

                return Ok(new { unreadCount = count });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
