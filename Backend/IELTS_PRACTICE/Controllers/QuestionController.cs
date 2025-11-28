using IELTS_PRACTICE.DTOs.Responses;
using IELTS_PRACTICE.DTOs.Resquests;
using IELTS_PRACTICE.Services;
using Microsoft.AspNetCore.Mvc;

namespace IELTS_PRACTICE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class QuestionController : ControllerBase
    {
        private readonly QuestionService _questionService;
        public QuestionController(QuestionService questionService)
        {
            _questionService = questionService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<QuestionDTO>>> GetAllQuestion()
        {
            return await _questionService.GetAllQuestion();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<QuestionDTO>> GetQuestionById(int id)
        {
            var question = await _questionService.GetQuestionById(id);
            if (question == null)
            {
                return NotFound();
            }
            return Ok(question);
        }

        [HttpGet("bytestid")]
        public async Task<ActionResult<QuestionDTO>> GetQuestionByTestId(int id)
        {
            var question = await _questionService.getQuestionByTestId(id);
            if (question == null)
            {
                return NotFound();
            }
            return Ok(question);
        }
        [HttpGet("allquestionsbyid")]
        public async Task<ActionResult<QuestionFullDetailDTO>> GetAllQuestionByTestId(int id)
        {
            var questions = await _questionService.getAllQuestionsAndParagraphByTestId(id);
            if (questions == null)
            {
                return NotFound();
            }
            return Ok(questions);
        }

        [HttpGet("questioncountintestid")]
        public async Task<ActionResult<int>> GetQuestionCountInTestId(int id)
        {
            var count = await _questionService.GetQuestionCountInTestId(id);
            return Ok(count);
        }

        [HttpPost]
        public async Task<ActionResult<QuestionFullDetailDTO>> CreateQuestion(CreateQuestionDTO rq)
        {
            var question = await _questionService.CreateQuestion(rq);

            return Ok(question);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<QuestionDTO>> UpdateQuestion(int id, UpdateQuestionDTO rq)
        {
            var current = await _questionService.GetQuestionOrParagraphById(id);
            if (current == null) { 
                return NotFound();
            }
            var updated = await _questionService.UpdateQuestion(id, rq);
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteQuestion(int id)
        {
            var question = await _questionService.GetQuestionById(id);
            if (question == null)
            {
                return NotFound();
            }
            await _questionService.DeleteQuestion(id);
            return NoContent();
        }

        [HttpPost("upload-excel")]
        [RequestSizeLimit(10 * 1024 * 1024)]
        public async Task<IActionResult> UploadQuestionExcel(IFormFile file, int testId, string testType)
        {
            var (success, message, importedCount) = await _questionService.UploadQuestionByExcelFile(file, testId, testType);

            if (!success)
            {
                return BadRequest(new { error = message });
            }

            return Ok(new
            {
                message = message,
                importedCount = importedCount
            });
        }
    }
}
