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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '12px',
      }}
    >
      {cards.map(card => (
        <Card key={card.href} card={card} />
      ))}
    </div>
  )
}

function Card({ card }: { card: CardItem }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link href={card.href} className="no-underline">
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="border border-black/[0.06] rounded-[14px] p-5 flex flex-col gap-2 cursor-pointer transition-[transform,box-shadow] duration-[120ms]"
        style={{
          background: card.color,
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: hovered ? '0 6px 20px rgba(0,0,0,0.08)' : 'none',
        }}
      >
        <div className="text-[1.6rem]">{card.emoji}</div>
        <div className="font-bold text-[0.95rem] text-gray-900">{card.title}</div>
        <div className="text-[0.78rem] text-gray-500 leading-[1.5]">{card.desc}</div>
      </div>
    </Link>
  )
}
