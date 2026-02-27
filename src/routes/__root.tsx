import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

const RootLayout = () => (
  <>
    <div className="flex gap-2 p-2">
      <Link to="/Home" className="[&.active]:font-bold">
        Home
      </Link>
      <Link to="/Dashboard" className="[&.active]:font-bold">
        Dashboard
      </Link>
      <Link to="/About" className="[&.active]:font-bold">
        About
      </Link>
    </div>
    <hr />
    <Outlet />
    <TanStackRouterDevtools />
  </>
)

export const Route = createRootRoute({ component: RootLayout })
