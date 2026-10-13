import { getMemberContext, loadAnswers } from '@/lib/member.ts'
import { QuestionForm } from './QuestionForm.tsx'

export const metadata = { title: 'My answers' }

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const { supabase, memberId } = await getMemberContext()
  const answers = await loadAnswers(supabase, memberId)
  return (
    <>
      <h1>{answers ? 'Your answers' : 'A few questions'}</h1>
      <p className="help">About 2 minutes. You can change these any time. We do not ask about your income or savings.</p>
      {error === 'state' && <div className="error">Please choose your state or territory (question 1).</div>}
      <QuestionForm initial={answers} />
    </>
  )
}
