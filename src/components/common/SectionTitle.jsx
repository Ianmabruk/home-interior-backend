export const SectionTitle = ({ eyebrow, title, body, align = 'center' }) => {
  const alignClass = align === 'left' ? 'text-left' : 'text-center mx-auto'
  return (
    <div className={`mb-12 max-w-2xl ${alignClass}`}>
      {eyebrow && (
        <p className="text-2xs font-medium uppercase tracking-widest text-orange mb-3">{eyebrow}</p>
      )}
      <h2 className="font-display text-4xl font-medium leading-tight text-ink md:text-5xl">
        {title}
      </h2>
      {body && (
        <p className="mt-4 text-sm leading-relaxed text-ink/55 md:text-base">{body}</p>
      )}
    </div>
  )
}
