'use client'
import { useEditor, EditorContent }
  from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from 
  '@tiptap/extension-underline'
import TextAlign from 
  '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Placeholder from 
  '@tiptap/extension-placeholder'
import { useEffect } 
  from 'react'
import {
  Bold, Italic, Underline as UnderlineIcon,
  Heading1, Heading2, Heading3,
  List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight,
  Link as LinkIcon, Minus,
  Undo, Redo, RemoveFormatting,
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  // HTML string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Commencez à écrire...',
  minHeight = 400,
}: RichTextEditorProps) {

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
        },
        orderedList: {
          keepMarks: true,
        },
      }),
      Underline,
      TextAlign.configure({
        types: [
          'heading', 'paragraph'
        ],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 
          'prose prose-sm max-w-none ' +
          'focus:outline-none ' +
          'text-gray-800 ' +
          'leading-relaxed ' +
          'px-5 py-4',
        style: `min-height: ${minHeight}px`,
      },
    },
  })

  // Sync external value changes
  useEffect(() => {
    if (
      editor &&
      value !== editor.getHTML()
    ) {
      editor.commands.setContent(
        value || '', { emitUpdate: false }
      )
    }
  }, [value, editor])

  // Add link
  function setLink() {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt(
      'URL du lien:', previousUrl || 'https://'
    )
    if (url === null) return
    if (url === '') {
      editor.chain().focus()
        .extendMarkRange('link')
        .unsetLink().run()
      return
    }
    editor.chain().focus()
      .extendMarkRange('link')
      .setLink({ href: url }).run()
  }

  if (!editor) return null

  // Toolbar button helper
  const ToolBtn = ({
    onClick,
    active = false,
    disabled = false,
    title,
    children,
  }: {
    onClick: () => void
    active?: boolean
    disabled?: boolean
    title: string
    children: React.ReactNode
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        w-8 h-8 rounded-lg
        flex items-center justify-center
        text-sm transition-all
        ${active
          ? 'bg-primary text-white shadow-sm'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
        }
        disabled:opacity-30
        disabled:cursor-not-allowed`}>
      {children}
    </button>
  )

  const Divider = () => (
    <div className="w-px h-6
      bg-gray-200 mx-1"/>
  )

  return (
    <div className="border-2
      border-gray-200
      focus-within:border-primary
      rounded-2xl overflow-hidden
      bg-white transition-colors">

      {/* ── TOOLBAR ── */}
      <div className="flex items-center
        flex-wrap gap-0.5 px-3 py-2
        border-b border-gray-100
        bg-gray-50/80">

        {/* History */}
        <ToolBtn
          onClick={() =>
            editor.chain().focus()
              .undo().run()
          }
          disabled={
            !editor.can().undo()
          }
          title="Annuler (Ctrl+Z)">
          <Undo className="w-4 h-4"/>
        </ToolBtn>
        <ToolBtn
          onClick={() =>
            editor.chain().focus()
              .redo().run()
          }
          disabled={
            !editor.can().redo()
          }
          title="Rétablir (Ctrl+Y)">
          <Redo className="w-4 h-4"/>
        </ToolBtn>

        <Divider/>

        {/* Headings */}
        <ToolBtn
          onClick={() =>
            editor.chain().focus()
              .toggleHeading({ level: 1 })
              .run()
          }
          active={editor.isActive(
            'heading', { level: 1 }
          )}
          title="Titre 1">
          <Heading1 className="w-4 h-4"/>
        </ToolBtn>
        <ToolBtn
          onClick={() =>
            editor.chain().focus()
              .toggleHeading({ level: 2 })
              .run()
          }
          active={editor.isActive(
            'heading', { level: 2 }
          )}
          title="Titre 2">
          <Heading2 className="w-4 h-4"/>
        </ToolBtn>
        <ToolBtn
          onClick={() =>
            editor.chain().focus()
              .toggleHeading({ level: 3 })
              .run()
          }
          active={editor.isActive(
            'heading', { level: 3 }
          )}
          title="Titre 3">
          <Heading3 className="w-4 h-4"/>
        </ToolBtn>

        <Divider/>

        {/* Formatting */}
        <ToolBtn
          onClick={() =>
            editor.chain().focus()
              .toggleBold().run()
          }
          active={editor.isActive('bold')}
          title="Gras (Ctrl+B)">
          <Bold className="w-4 h-4"/>
        </ToolBtn>
        <ToolBtn
          onClick={() =>
            editor.chain().focus()
              .toggleItalic().run()
          }
          active={editor.isActive('italic')}
          title="Italique (Ctrl+I)">
          <Italic className="w-4 h-4"/>
        </ToolBtn>
        <ToolBtn
          onClick={() =>
            editor.chain().focus()
              .toggleUnderline().run()
          }
          active={
            editor.isActive('underline')
          }
          title="Souligné (Ctrl+U)">
          <UnderlineIcon className="w-4 h-4"/>
        </ToolBtn>

        <Divider/>

        {/* Lists */}
        <ToolBtn
          onClick={() =>
            editor.chain().focus()
              .toggleBulletList().run()
          }
          active={
            editor.isActive('bulletList')
          }
          title="Liste à puces">
          <List className="w-4 h-4"/>
        </ToolBtn>
        <ToolBtn
          onClick={() =>
            editor.chain().focus()
              .toggleOrderedList().run()
          }
          active={
            editor.isActive('orderedList')
          }
          title="Liste numérotée">
          <ListOrdered className="w-4 h-4"/>
        </ToolBtn>

        <Divider/>

        {/* Alignment */}
        <ToolBtn
          onClick={() =>
            editor.chain().focus()
              .setTextAlign('left').run()
          }
          active={
            editor.isActive({
              textAlign: 'left'
            })
          }
          title="Aligner à gauche">
          <AlignLeft className="w-4 h-4"/>
        </ToolBtn>
        <ToolBtn
          onClick={() =>
            editor.chain().focus()
              .setTextAlign('center').run()
          }
          active={
            editor.isActive({
              textAlign: 'center'
            })
          }
          title="Centrer">
          <AlignCenter className="w-4 h-4"/>
        </ToolBtn>
        <ToolBtn
          onClick={() =>
            editor.chain().focus()
              .setTextAlign('right').run()
          }
          active={
            editor.isActive({
              textAlign: 'right'
            })
          }
          title="Aligner à droite">
          <AlignRight className="w-4 h-4"/>
        </ToolBtn>

        <Divider/>

        {/* Link & Separator */}
        <ToolBtn
          onClick={setLink}
          active={editor.isActive('link')}
          title="Ajouter un lien">
          <LinkIcon className="w-4 h-4"/>
        </ToolBtn>
        <ToolBtn
          onClick={() =>
            editor.chain().focus()
              .setHorizontalRule().run()
          }
          title="Ligne de séparation">
          <Minus className="w-4 h-4"/>
        </ToolBtn>

        <Divider/>

        {/* Clear formatting */}
        <ToolBtn
          onClick={() =>
            editor.chain().focus()
              .clearNodes()
              .unsetAllMarks()
              .run()
          }
          title="Effacer la mise en forme">
          <RemoveFormatting
            className="w-4 h-4"/>
        </ToolBtn>

        {/* Word count */}
        <div className="ml-auto
          text-[10px] text-gray-400
          font-mono px-2">
          {editor.storage.characterCount
            ?.characters?.() ||
            editor.getText().length
          } car.
        </div>
      </div>

      {/* ── EDITOR AREA ── */}
      <EditorContent
        editor={editor}
        className="w-full bg-white"
      />
    </div>
  )
}
