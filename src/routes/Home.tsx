import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/Home')({
  component: Home,
})

function Home() {
  return <div>Home</div>
}
