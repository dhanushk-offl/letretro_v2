import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { notes, roomName } = await request.json()

    // Validate input
    if (!notes || Object.keys(notes).length === 0) {
      return NextResponse.json({ error: "No notes provided" }, { status: 400 })
    }

    // Format the notes for the AI
    let formattedNotes = "Retrospective Notes:\n\n"

    Object.entries(notes).forEach(([username, userNotes]) => {
      formattedNotes += `${username}'s notes:\n`;
      // Type check to ensure userNotes is an array
      if (Array.isArray(userNotes)) {
        userNotes.forEach((note: string) => {
          formattedNotes += `- ${note}\n`
        });
      }
      formattedNotes += "\n"
    })

    // Prepare the prompt for Groq API with Llama 3
    const prompt = `
You are an expert facilitator for agile team retrospectives. You've been asked to analyze and summarize the notes from a retrospective session titled "${roomName}".

Here are the notes from the retrospective, organized by team member:

${formattedNotes}

Please provide a comprehensive summary of the retrospective that includes:
1. Overall themes and patterns you notice
2. Key insights from each contributor (include their names)
3. Potential action items the team should consider
4. A brief conclusion

Format your response with clear sections and make it actionable for the team.
`

    // Call Groq API with Llama 3
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content:
              "You are an expert agile retrospective facilitator who provides insightful summaries of team retrospectives.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Groq API error:", errorData)
      throw new Error(`Groq API error: ${response.status}`)
    }

    const data = await response.json()
    const summary = data.choices[0].message.content

    return NextResponse.json({ summary })
  } catch (error) {
    console.error("Error generating AI summary:", error)

    // Fallback summary if the API fails
    const fallbackSummary = `# Summary of Retrospective

## Overall Themes

The team discussed various aspects of the project including challenges, successes, and areas for improvement.

## Contributor Insights

${Object.keys(await request.json().then((data) => data.notes || {}))
  .map((username) => `${username} contributed: Several important observations about the project process.\n\n`)
  .join("")}

## Recommended Action Items

1. Schedule a follow-up meeting to address the key challenges identified
2. Recognize team members for the successes highlighted
3. Implement process improvements based on the feedback

## Conclusion

This retrospective provided valuable insights into the team's experience. The team should focus on addressing the identified challenges while building on the successes.

Note: This is a fallback summary as we couldn't connect to the AI service. Please try again later for a more detailed analysis.`

    return NextResponse.json({ summary: fallbackSummary })
  }
}

