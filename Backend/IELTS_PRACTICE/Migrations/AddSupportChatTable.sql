-- Migration to add SupportChats table
-- Run this SQL script in your SQL Server database

USE [IELTSApp]
GO

CREATE TABLE [ieltsapp].[supportchats] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [StudentId] INT NOT NULL,
    [AdminId] INT NULL,
    [Message] NVARCHAR(MAX) NOT NULL,
    [SentBy] NVARCHAR(50) NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL,
    [IsRead] BIT NOT NULL DEFAULT 0,
    CONSTRAINT [PK_supportchats] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_supportchats_users_StudentId] FOREIGN KEY ([StudentId]) 
        REFERENCES [ieltsapp].[users] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_supportchats_users_AdminId] FOREIGN KEY ([AdminId]) 
        REFERENCES [ieltsapp].[users] ([Id]) ON DELETE NO ACTION
);
GO

-- Create indexes for better performance
CREATE INDEX [IX_supportchats_StudentId] ON [ieltsapp].[supportchats] ([StudentId]);
GO

CREATE INDEX [IX_supportchats_AdminId] ON [ieltsapp].[supportchats] ([AdminId]);
GO

CREATE INDEX [IX_supportchats_IsRead] ON [ieltsapp].[supportchats] ([IsRead]);
GO

CREATE INDEX [IX_supportchats_CreatedAt] ON [ieltsapp].[supportchats] ([CreatedAt] DESC);
GO

PRINT 'SupportChats table created successfully!'
