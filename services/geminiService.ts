
import { GoogleGenAI, Type } from "@google/genai";
import { HabitEntry, HabitType, User } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface HabitAnalysisResponse {
  message: string;
  estimatedCalories?: number;
}

export const analyzeHabit = async (
  newHabit: HabitEntry, 
  history: HabitEntry[], 
  user: User
): Promise<HabitAnalysisResponse> => {
  try {
    const isDiet = newHabit.type === HabitType.DIET;
    const isExercise = newHabit.type === HabitType.EXERCISE;
    const isWeight = newHabit.type === HabitType.WEIGHT;
    const goal = user.goal;
    
    let goalContext = "";
    if (goal) {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      startOfWeek.setHours(0, 0, 0, 0);
      
      const thisWeekCount = history.filter(h => 
        h.type === HabitType.EXERCISE && h.timestamp >= startOfWeek.getTime()
      ).length + (isExercise ? 1 : 0);

      const todaysCalories = history
        .filter(h => h.type === HabitType.DIET && h.timestamp >= startOfDay)
        .reduce((sum, h) => sum + (h.calories || 0), 0);

      const weightEntries = history.filter(h => h.type === HabitType.WEIGHT && h.weight !== undefined);
      const latestWeight = isWeight ? newHabit.weight : (weightEntries.sort((a, b) => b.timestamp - a.timestamp)[0]?.weight || user.currentWeight);
      
      goalContext = `
        目標: ${goal.description}
        1日目標カロリー: ${user.targetCalories || "-"} kcal
        現在摂取: ${todaysCalories} kcal
        残り日数: ${Math.ceil((goal.deadline - Date.now()) / (1000 * 60 * 60 * 24))}日
        今週の運動: ${thisWeekCount}回
        現在の体重: ${latestWeight || "-"}kg (目標: ${goal.targetWeight || "-"}kg)
      `;
    }

    const prompt = `
      パーソナルコーチとして、ユーザー「${newHabit.userName}」の記録にフィードバックしてください。
      記録: "${newHabit.content}" (${newHabit.type})
      ${goalContext}

      指示:
      1. 80文字以内で、目標に寄り添った具体的で温かいアドバイスを。
      2. 食事なら、内容からカロリー(kcal)を推定。

      出力形式: JSON
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            estimatedCalories: { type: Type.NUMBER },
          },
          required: ["message"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return {
      message: result.message || "ナイスチャレンジ！✨",
      estimatedCalories: result.estimatedCalories || 0,
    };
  } catch (error) {
    console.error(error);
    return { message: "その調子です！応援しています。💪", estimatedCalories: 0 };
  }
};

export const generateCheer = async (habit: HabitEntry, cheerleaderName: string): Promise<string> => {
  try {
    const prompt = `
      あなたはSNSの優しい友人です。
      友人の「${habit.userName}」が「${habit.content}」という記録をしました。
      これに対して、「${cheerleaderName}」として、最高に温かくて元気が出る励ましのコメントを1つ送ってください。
      
      条件:
      - 50文字以内。
      - 相手を否定せず、努力を称える。
      - 友達らしい親しみやすい口調で。
      - 絵文字を1つか2つ使う。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "すごい！応援してるよ！✨";
  } catch (error) {
    return "ナイス！その調子！👏";
  }
};
