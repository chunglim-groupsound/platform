'use client'

import Link from 'next/link'
import { useState } from 'react'

interface CardItem {
  href: string
  emoji: string
  title: string
  desc: string
  color: string
}

export function DashboardCards({ cards }: { cards: CardItem[] }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: '12px',
    }}>
      {cards.map(card => (
        <Card key={card.href} card={card} />
      ))}
    </div>
  )
}

function Card({ card }: { card: CardItem }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link href={card.href} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: card.color,
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          cursor: 'pointer',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: hovered ? '0 6px 20px rgba(0,0,0,0.08)' : 'none',
          transition: 'transform 0.12s, box-shadow 0.12s',
        }}
      >
        <div style={{ fontSize: '1.6rem' }}>{card.emoji}</div>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>{card.title}</div>
        <div style={{ fontSize: '0.78rem', color: '#6b7280', lineHeight: '1.5' }}>{card.desc}</div>
      </div>
    </Link>
  )
}
