using IELTS_PRACTICE.Contexts;
using IELTS_PRACTICE.DTOs.Responses;
using IELTS_PRACTICE.DTOs.Resquests;
using IELTS_PRACTICE.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using System.Threading.Tasks;

namespace IELTS_PRACTICE.Services
{
    public class QuestionService
    {
        private readonly AppDbContext _context;
        public QuestionService(AppDbContext context) { 
            _context = context;
        }

        public async Task<List<QuestionDTO>> GetAllQuestion() {
            return _context.Questions
                .Where(x => x.ParentId != 0) //parentId == 0 is content
                .Select(x => new QuestionDTO {
                    Id = x.Id,
                    QuestionType = x.QuestionType,
                    Content = x.Content,
                    CorrectAnswer = x.CorrectAnswer,
                    Choices = x.Choices,
                    Explanation = x.Explanation,
                    TestId = x.TestId,
                    Order = x.Order,
                }).ToList();
        }

        public async Task<QuestionDTO> GetQuestionById(int id)
        {
            return await _context.Questions
                .Where(x => x.ParentId != 0 && x.Id == id) //parentId == 0 is content NEED TO DELETE THE PARENT ID THING HERE, NO USE AND IT'S CONFUSING
                .Select(x => new QuestionDTO
                {
                    Id = x.Id,
                    QuestionType = x.QuestionType,
                    Content = x.Content,
                    CorrectAnswer = x.CorrectAnswer,
                    Choices = x.Choices,
                    Explanation = x.Explanation,
                    TestId = x.TestId,
                    Order = x.Order,
                })
                .FirstOrDefaultAsync();
        }

        public async Task<QuestionDTO> GetQuestionOrParagraphById(int id)
        {
            return await _context.Questions
                .Where(x => x.Id == id)
                .Select(x => new QuestionDTO
                {
                    Id = x.Id,
                    QuestionType = x.QuestionType,
                    Content = x.Content,
                    CorrectAnswer = x.CorrectAnswer,
                    Choices = x.Choices,
                    Explanation = x.Explanation,
                    TestId = x.TestId,
                    Order = x.Order,
                })
                .FirstOrDefaultAsync();
        }

        public async Task<List<QuestionFullDetailDTO>> getQuestionByTestId(int id)
        {
            return _context.Questions
                .Where(x => x.TestId == id)
                .Select(x => new QuestionFullDetailDTO
                {
                    Id = x.Id,
                    QuestionType = x.QuestionType,
                    Content = x.Content,
                    Choices = x.Choices,
                    CorrectAnswer = x.CorrectAnswer,
                    Explanation = x.Explanation,
                    TestId = x.TestId,
                    Order = x.Order,
                    ParentId = x.ParentId,
                    Link = x.Link,

                }).ToList();
        }


        public async Task<int> GetQuestionCountInTestId(int id)
        {
            return await _context.Questions
                .Where(x => x.TestId == id && x.ParentId != 0).CountAsync();
        }


        public async Task<List<QuestionFullDetailDTO>> getAllQuestionsAndParagraphByTestId(int id)
        {
            return await _context.Questions
                .Where(x => x.TestId == id)
                .Select(x => new QuestionFullDetailDTO
                {
                    Id = x.Id,
                    QuestionType = x.QuestionType,
                    Content = x.Content,
                    CorrectAnswer = x.CorrectAnswer,
                    Choices = x.Choices,
                    Explanation = x.Explanation,
                    TestId = x.TestId,
                    ParentId = x.ParentId,
                    Order = x.Order,
                    Link = x.Link,
                }).ToListAsync();
        }

        public async Task<QuestionFullDetailDTO> CreateQuestion(CreateQuestionDTO rq) {
            if (rq.ParentId == 0) {
                var content = new Question
                {
                    QuestionType = rq.QuestionType,
                    Content = rq.Content,
                    CorrectAnswer = "",
                    Choices = "",
                    Explanation = rq.Explanation,
                    ParentId = rq.ParentId,
                    //TypeId = rq.TypeId,
                    TestId = rq.TestId,
                    Link = "",
                    Order = rq.Order,
                };
                _context.Questions.Add(content);
                await _context.SaveChangesAsync();
                return new QuestionFullDetailDTO
                {
                    Id = content.Id,
                    Content = rq.Content,
                    TestId= rq.TestId,
                   
                };
            }

            var question = new Question
            {
                QuestionType = rq.QuestionType,
                Content = rq.Content,
                CorrectAnswer = rq.CorrectAnswer,
                Choices = rq.Choices,
                Explanation = rq.Explanation,
                ParentId = rq.ParentId,
                //TypeId = rq.TypeId,
                TestId = rq.TestId,
                Link = rq.Link,
                Order = rq.Order,
            };
            _context.Questions.Add(question);
            await _context.SaveChangesAsync();
            return new QuestionFullDetailDTO
            {
                Id = question.Id,
                QuestionType = question.QuestionType,
                Content = question.Content,
                CorrectAnswer = question.CorrectAnswer,
                Choices= question.Choices,
                Explanation = question.Explanation,
                TestId = question.TestId,
                ParentId = question.ParentId,
                Order = question.Order,
                Link = question.Link,
            };
        }

        public async Task<QuestionFullDetailDTO> UpdateQuestion(int id, UpdateQuestionDTO rq)
        {
            var question = await _context.Questions.FindAsync(id);
            if (question == null)
            {
                return null;
            }

            question.QuestionType = rq.QuestionType;
            question.Content = rq.Content;
            question.CorrectAnswer = rq.CorrectAnswer;
            question.Choices = rq.Choices;
            question.Explanation = rq.Explanation;
            question.Link = rq.Link;
            question.Order = rq.Order;
            question.ParentId = rq.ParentId;

            _context.Questions.Update(question);
            await _context.SaveChangesAsync();
            return new QuestionFullDetailDTO
            {   
                Id = question.Id,
                QuestionType = question.QuestionType,
                Content = question.Content,
                CorrectAnswer = question.CorrectAnswer,
                Choices = question.Choices,
                Explanation = question.Explanation,
                TestId = question.TestId,
                ParentId = question.ParentId,
                Order = question.Order,
                Link = question.Link,
            };
        }

        public async Task DeleteQuestion(int id) {
            var question = _context.Questions.Find(id);
            _context.Questions.Remove(question);
            await _context.SaveChangesAsync();
        }

        public async Task<(bool Success, string Message, int ImportedCount)> UploadQuestionByExcelFile(IFormFile formFile, int testId, string testType) {
            //validation
            if (formFile == null || formFile.Length == 0)
            {
                return (false, "No file provided or file is empty", 0);
            }

            var allowedExtensions = new[] { ".xlsx", ".xls" };
            var fileExtension = Path.GetExtension(formFile.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(fileExtension))
            {
                return (false, "Invalid file format. Only .xlsx and .xls files are allowed", 0);
            }

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var questions = new List<Question>();
                var contents = new List<Question>();
                var parentIdMap = new Dictionary<int, int>();
                using var memoryStream = new MemoryStream();
                await formFile.CopyToAsync(memoryStream);
                using (var excelPackage = new ExcelPackage(memoryStream)) 
                {
                    var workSheet = excelPackage.Workbook.Worksheets["Questions"];
                    if (workSheet == null) {
                        return (false, "Cannot found this worksheet", 0);
                    }

                    //check data of worksheet
                    if (workSheet.Dimension == null) {
                        return (false, "Worksheet is empty", 0);
                    }

                    int rowCount = workSheet.Dimension.Rows;
                    if (rowCount < 2)
                    {
                        return (false, "Excel file must contain at least one data row", 0);
                    }

                    int begin = 0;
                    if (testType.ToLower().Equals("reading"))
                    {
                        begin = 5;
                    }
                    else if(testType.ToLower().Equals("listening")) {
                        begin = 6;
                    }

                    //xu ly content
                    for (int row = 2; row < begin; row++) {
                        string GetCellValue(int col) => workSheet.Cells[row, col].Value?.ToString()?.Trim() ?? string.Empty;
                        int GetIntCellValue(int col) => int.TryParse(GetCellValue(col), out int result) ? result : 0;
                        var currentContent = new Question
                        {
                            QuestionType = GetCellValue(1),
                            Content = GetCellValue(2),
                            CorrectAnswer = "",
                            Choices = "",
                            Explanation = "",
                            Link = "",
                            ParentId = 0,
                            TestId = testId,
                            Order = GetIntCellValue(9) //1 | 2 | 3 specify sequence of paragraph
                        };
                        contents.Add(currentContent);
                    }
                    await _context.Questions.AddRangeAsync(contents);
                    await _context.SaveChangesAsync();
                    //cho vao hashmap de biet Thu tu va ID cua paragraph
                    //pp1 : 10
                    //pp2 : 12
                    //pp3 : 13
                    foreach(var content in contents) {
                        parentIdMap.Add(content.Order, content.Id);
                    }

                    //bth neu khong co paragraph/audio row = 2
                    for (int row = begin; row <= rowCount; row++)
                    {
                        // Helper function to safely get string value from cell
                        string GetCellValue(int col) => workSheet.Cells[row, col].Value?.ToString()?.Trim() ?? string.Empty;

                        // Helper function to safely parse integer value from cell
                        int GetIntCellValue(int col) => int.TryParse(GetCellValue(col), out int result) ? result : 0;

                        var currentQuestion = new Question
                        {
                            QuestionType = GetCellValue(1),
                            Content = GetCellValue(2),
                            CorrectAnswer = GetCellValue(3),
                            Choices = GetCellValue(4),
                            Explanation = GetCellValue(5),
                            ParentId = parentIdMap[GetIntCellValue(6)],
                            TestId = testId,
                            Link = GetCellValue(8),
                            Order = GetIntCellValue(9)
                        };

                        questions.Add(currentQuestion);
                    }

                    if (questions.Count == 0)
                    {
                        return (false, "No valid questions found in the Excel file", 0);
                    }
                    await _context.Questions.AddRangeAsync(questions);
                    await _context.SaveChangesAsync();

                    //commit transaction
                    await transaction.CommitAsync();
                    return (true, $"Successfully imported {questions.Count} question(s)", questions.Count);
                }
            }
            catch (Exception ex) 
            {
                await transaction.RollbackAsync();
                return (false, $"Error importing questions: {ex.Message}", 0);
            }
        }
    }
}
