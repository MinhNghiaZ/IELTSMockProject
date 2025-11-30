using IELTS_PRACTICE.Models;
using Microsoft.EntityFrameworkCore;

namespace IELTS_PRACTICE.Contexts
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions options) : base(options)
        {
        }

        public DbSet<Question> Questions { get; set; }
        public DbSet<StudentMetaData> StudentMetaDatas { get; set; }
        public DbSet<Test> Tests { get; set; }
        public DbSet<TestSubmission> TestSubmissions { get; set; }
        public DbSet<TestSubmissionDetail> TestSubmissionDetails { get; set; }
        public DbSet<TypeSkill> TypeSkills { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Media> Media { get; set; }
        public DbSet<SupportChat> SupportChats { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Configure schema and lowercase table names to match existing database
            modelBuilder.Entity<Question>().ToTable("questions", "ieltsapp");
            modelBuilder.Entity<StudentMetaData>().ToTable("studentmetadatas", "ieltsapp");
            modelBuilder.Entity<Test>().ToTable("tests", "ieltsapp");
            modelBuilder.Entity<TestSubmission>().ToTable("testsubmissions", "ieltsapp");
            modelBuilder.Entity<TestSubmissionDetail>().ToTable("testsubmissiondetails", "ieltsapp");
            modelBuilder.Entity<TypeSkill>().ToTable("typeskills", "ieltsapp");
            modelBuilder.Entity<User>().ToTable("users", "ieltsapp");
            modelBuilder.Entity<Media>().ToTable("media", "ieltsapp");
            modelBuilder.Entity<SupportChat>().ToTable("supportchats", "ieltsapp");

            modelBuilder.Entity<User>()
                .HasMany(u => u.TestSubmissions)
                .WithOne(ts => ts.User)
                .HasForeignKey(ts => ts.UserId);

            modelBuilder.Entity<User>()
                .HasOne(u => u.StudentMetaData)
                .WithOne(mt => mt.User)
                .HasForeignKey<StudentMetaData>(mt => mt.UserId);

            modelBuilder.Entity<Question>()
                .HasOne(q => q.Test)
                .WithMany(t => t.Questions)
                .HasForeignKey(q => q.TestId);

            //modelBuilder.Entity<Question>()
            //    .HasOne(q => q.TypeSkill)
            //    .WithMany(t => t.Questions)
            //    .HasForeignKey(q => q.TypeId);

            modelBuilder.Entity<Test>()
                .HasMany(t => t.TestSubmissions)
                .WithOne(ts => ts.Test)
                .HasForeignKey(ts => ts.TestId);

            modelBuilder.Entity<Test>()
                .HasOne(t => t.TypeSkill)
                .WithMany(ts => ts.Tests)
                .HasForeignKey(t => t.TypeId);

            modelBuilder.Entity<TestSubmission>()
                .HasOne(ts => ts.TestSubmissionDetail)
                .WithOne(tsd => tsd.TestSubmission)
                .HasForeignKey<TestSubmissionDetail>(tsd => tsd.SubmissionId);

            modelBuilder.Entity<SupportChat>()
                .HasOne(sc => sc.Student)
                .WithMany()
                .HasForeignKey(sc => sc.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SupportChat>()
                .HasOne(sc => sc.Admin)
                .WithMany()
                .HasForeignKey(sc => sc.AdminId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
