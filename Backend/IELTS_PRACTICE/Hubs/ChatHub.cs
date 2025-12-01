using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace IELTS_PRACTICE.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly ILogger<ChatHub> _logger;

        public ChatHub(ILogger<ChatHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst("userId")?.Value 
                      ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value;
            
            _logger.LogInformation($"🔌 SignalR User connected: UserId={userId}, Role={role}, ConnectionId={Context.ConnectionId}");
            
            if (!string.IsNullOrEmpty(userId))
            {
                // Add user to their personal group
                await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
                _logger.LogInformation($"✅ Added user {userId} to group User_{userId}");
                
                // Add admins to admin group
                if (role == "Admin")
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");
                    _logger.LogInformation($"✅ Added admin {userId} to Admins group");
                }
            }
            else
            {
                _logger.LogWarning("⚠️ User connected without userId claim");
            }
            
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst("userId")?.Value 
                      ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value;
            
            _logger.LogInformation($"🔌 SignalR User disconnected: UserId={userId}, Role={role}, ConnectionId={Context.ConnectionId}");
            
            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"User_{userId}");
                
                if (role == "Admin")
                {
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, "Admins");
                }
            }
            
            await base.OnDisconnectedAsync(exception);
        }
    }
}
