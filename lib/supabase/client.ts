import { createBrowserClient } from "@supabase/ssr";
import { Database, UserTaskMetadata, QuizAnswers, ChatMessageMetadata } from "@/lib/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// Export a singleton instance for easier usage
export const supabase = createClient();

// Helper functions for common operations
export const db = {
  // Profile operations
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Database['public']['Tables']['profiles']['Update']) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Task operations
  async getTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('order_index');
    
    if (error) throw error;
    return data;
  },

  async getUserTasks(userId: string) {
    const { data, error } = await supabase
      .from('user_tasks')
      .select(`
        *,
        task:tasks(*)
      `)
      .eq('user_id', userId)
      .order('created_at');
    
    if (error) throw error;
    return data;
  },

  async getTasksWithProgress(userId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        user_tasks!left(*)
      `)
      .eq('user_tasks.user_id', userId)
      .order('order_index');
    
    if (error) throw error;
    return data;
  },

  async completeTask(userId: string, taskId: number, metadata?: UserTaskMetadata) {
    const { data, error } = await supabase
      .from('user_tasks')
      .upsert({
        user_id: userId,
        task_id: taskId,
        completed: true,
        completed_at: new Date().toISOString(),
        metadata: metadata || {},
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Progress operations
  async getUserProgress(userId: string) {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  },

  // Document operations
  async getUserDocuments(userId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async uploadDocument(document: Database['public']['Tables']['documents']['Insert']) {
    const { data, error } = await supabase
      .from('documents')
      .insert(document)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Quiz operations
  async getQuizzes() {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('is_active', true)
      .order('created_at');
    
    if (error) throw error;
    return data;
  },

  async getQuizAttempts(userId: string, quizId?: string) {
    let query = supabase
      .from('quiz_attempts')
      .select(`
        *,
        quiz:quizzes(*)
      `)
      .eq('user_id', userId);
    
    if (quizId) {
      query = query.eq('quiz_id', quizId);
    }
    
    const { data, error } = await query.order('started_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async startQuizAttempt(userId: string, quizId: string) {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: userId,
        quiz_id: quizId,
        answers: {},
        started_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async submitQuizAttempt(attemptId: string, answers: QuizAnswers, score: number, passed: boolean) {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .update({
        answers,
        score,
        passed,
        completed_at: new Date().toISOString(),
        time_taken_minutes: 0 // Calculate actual time taken
      })
      .eq('id', attemptId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Chat operations
  async getChatMessages(userId: string, chatType: string = 'general') {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .eq('chat_type', chatType)
      .order('created_at');
    
    if (error) throw error;
    return data;
  },

  async sendChatMessage(userId: string, message: string, isFromUser: boolean, chatType: string = 'general', metadata?: ChatMessageMetadata) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: userId,
        chat_type: chatType,
        message,
        is_from_user: isFromUser,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Video introduction operations
  async getVideoIntroductions(userId: string) {
    const { data, error } = await supabase
      .from('video_introductions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async uploadVideoIntroduction(video: Database['public']['Tables']['video_introductions']['Insert']) {
    const { data, error } = await supabase
      .from('video_introductions')
      .insert(video)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Storage helper functions
export const storage = {
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    
    if (error) throw error;
    return data;
  },

  async getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  },

  async downloadFile(bucket: string, path: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
    
    if (error) throw error;
    return data;
  },

  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) throw error;
  }
};
