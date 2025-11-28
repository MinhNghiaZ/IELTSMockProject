using IELTS_PRACTICE.Contexts;
using IELTS_PRACTICE.DTOs.Responses;
using IELTS_PRACTICE.DTOs.Resquests;
using IELTS_PRACTICE.Models;
using Microsoft.EntityFrameworkCore;

namespace IELTS_PRACTICE.Services
{
    public class TestSubmissionDetailService
    {
        private readonly AppDbContext _context;
        public TestSubmissionDetailService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<TestSubmissionDetailDTO>> GetAllTestSubmissionDetail()
        {
            return await _context.TestSubmissionDetails
                .Select(x => new TestSubmissionDetailDTO
                {
                    Id = x.Id,
                    SubmissionId = x.SubmissionId,
                    Feedback = x.Feedback,
                    Answer = x.Answer,
                })
                .ToListAsync();
        }

        public async Task<TestSubmissionDetailDTO> GetTestSubmissionDetailById(int id)
        {
            return await _context.TestSubmissionDetails
                //.Where(x => x.Id == id)
                .Where(x => x.SubmissionId == id)
                .Select(x => new TestSubmissionDetailDTO
                {
                    Id = x.Id,
                    SubmissionId = x.SubmissionId,
                    Feedback = x.Feedback,
                    Answer = x.Answer,
                }).FirstOrDefaultAsync();
        }

        public async Task<TestSubmissionDetailDTO> CreateTestSubmissionDetail(CreateTestSubmissionDetailDTO rq)
        {
            var newSubmiss = new TestSubmissionDetail
            {
                SubmissionId = rq.SubmissionId,
                Feedback = rq.Feedback,
                Answer = rq.Answer,
            };
            _context.TestSubmissionDetails.Add(newSubmiss);
            await _context.SaveChangesAsync();

            return new TestSubmissionDetailDTO
            {
                SubmissionId = rq.SubmissionId,
                Feedback = rq.Feedback,
                Answer = rq.Answer,
            };
        }

        public async Task DeleteTestSubmissionDetail(int id)
        {
            var test = await _context.TestSubmissionDetails.FindAsync(id);
            _context.TestSubmissionDetails.Remove(test);
            _context.SaveChanges();
        }
    }
}
