import '../styles/index.css'
import '@vime/core/themes/default.css'

import FullPageLoader from '@components/Common/FullPageLoader'
import usePersistStore from '@lib/store/persist'
import { AUTH_ROUTES } from '@utils/data/auth-routes'
import { AUTH } from '@utils/url-path'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { lazy, Suspense, useEffect } from 'react'

export { reportWebVitals } from 'next-axiom'

const Providers = lazy(() => import('../components/Common/Providers'))
const Layout = lazy(() => import('../components/Common/Layout'))

const App = ({ Component, pageProps }: AppProps) => {
  const isAuthenticated = usePersistStore((state) => state.isAuthenticated)
  const { pathname, replace, asPath } = useRouter()

  useEffect(() => {
    if (!isAuthenticated && AUTH_ROUTES.includes(pathname)) {
      replace(`${AUTH}?next=${asPath}`)
    }
  }, [isAuthenticated, pathname, asPath, replace])

  return (
    <Suspense fallback={<FullPageLoader />}>
      <Providers>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </Providers>
    </Suspense>
  )
}

export default App
