import type { ColorKey } from './NoteEditorModal'

export interface NoteTemplate {
  icon: string
  title: string
  content: string
  category: string
  color: ColorKey
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    icon: '🎥',
    title: 'Watch Party Checklist',
    content: '• Snacks & drinks ready\n• Friends invited\n• Sound setup checked\n• Movie selected:\n• Start time:',
    category: 'Marathon',
    color: 'yellow',
  },
  {
    icon: '🍿',
    title: 'Weekend Marathon Plan',
    content: 'Theme: \n1. \n2. \n3. \nTotal runtime: ~ hours',
    category: 'Marathon',
    color: 'blue',
  },
  {
    icon: '📝',
    title: 'Film Review Notes',
    content: 'Cinematography: \nActing / Performance: \nPlot & Pacing: \nKey takeaway / Rating:',
    category: 'Reviews',
    color: 'green',
  },
  {
    icon: '💡',
    title: 'Theory & Analysis',
    content: 'Title: \nCore Symbolism: \nCharacter Arc Analysis: \nUnresolved Plot Mysteries:',
    category: 'Theories',
    color: 'blue',
  },
]
