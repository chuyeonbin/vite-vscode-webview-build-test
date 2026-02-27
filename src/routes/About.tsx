import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { Loading } from '../components/Loading'

export const Route = createFileRoute('/About')({
  component: About,
})

function About() {
  return (
    <Suspense>
      <Suspense fallback={<Loading />}>
        <div>About</div>
      </Suspense>
    </Suspense>
  )
}
