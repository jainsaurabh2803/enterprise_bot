import { 
  type User, type InsertUser,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  type WorkflowStep, type InsertWorkflowStep
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, updates: Partial<InsertConversation>): Promise<Conversation | undefined>;
  deleteConversation(id: string): Promise<boolean>;
  
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  getWorkflowSteps(conversationId: string): Promise<WorkflowStep[]>;
  createWorkflowStep(step: InsertWorkflowStep): Promise<WorkflowStep>;
  updateWorkflowStep(id: string, updates: Partial<InsertWorkflowStep>): Promise<WorkflowStep | undefined>;
  clearWorkflowSteps(conversationId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private conversations: Map<string, Conversation>;
  private messages: Map<string, Message>;
  private workflowSteps: Map<string, WorkflowStep>;

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.workflowSteps = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const now = new Date();
    const conversation: Conversation = {
      ...insertConversation,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const existing = this.conversations.get(id);
    if (!existing) return undefined;
    
    const updated: Conversation = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.conversations.set(id, updated);
    return updated;
  }

  async deleteConversation(id: string): Promise<boolean> {
    const messagesForConvo = Array.from(this.messages.values())
      .filter(m => m.conversationId === id);
    for (const msg of messagesForConvo) {
      this.messages.delete(msg.id);
    }
    
    const stepsForConvo = Array.from(this.workflowSteps.values())
      .filter(s => s.conversationId === id);
    for (const step of stepsForConvo) {
      this.workflowSteps.delete(step.id);
    }
    
    return this.conversations.delete(id);
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      hasResponse: insertMessage.hasResponse ?? false,
      id,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async getWorkflowSteps(conversationId: string): Promise<WorkflowStep[]> {
    return Array.from(this.workflowSteps.values())
      .filter(s => s.conversationId === conversationId)
      .sort((a, b) => a.stepNumber - b.stepNumber);
  }

  async createWorkflowStep(insertStep: InsertWorkflowStep): Promise<WorkflowStep> {
    const id = randomUUID();
    const step: WorkflowStep = {
      ...insertStep,
      response: insertStep.response ?? null,
      id,
      createdAt: new Date(),
    };
    this.workflowSteps.set(id, step);
    return step;
  }

  async updateWorkflowStep(id: string, updates: Partial<InsertWorkflowStep>): Promise<WorkflowStep | undefined> {
    const existing = this.workflowSteps.get(id);
    if (!existing) return undefined;
    
    const updated: WorkflowStep = {
      ...existing,
      ...updates,
    };
    this.workflowSteps.set(id, updated);
    return updated;
  }

  async clearWorkflowSteps(conversationId: string): Promise<void> {
    const stepsForConvo = Array.from(this.workflowSteps.values())
      .filter(s => s.conversationId === conversationId);
    for (const step of stepsForConvo) {
      this.workflowSteps.delete(step.id);
    }
  }
}

export const storage = new MemStorage();
