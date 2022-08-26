import { useLazyQuery, useMutation } from '@apollo/client'
import { PROFILES_QUERY } from '@gql/queries'
import { AUTHENTICATE_MUTATION, CHALLENGE_QUERY } from '@gql/queries/auth'
import logger from '@lib/logger'
import useAppStore from '@lib/store'
import usePersistStore from '@lib/store/persist'
import { ERROR_MESSAGE } from '@utils/constants'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import toast from 'react-hot-toast'
import { Profile } from 'src/types'
import { useAccount, useSignMessage } from 'wagmi'

import ConnectWalletButton from './ConnectWalletButton'

const Login = () => {
  const router = useRouter()
  const { address } = useAccount()
  const setShowCreateChannel = useAppStore(
    (state) => state.setShowCreateChannel
  )
  const setChannels = useAppStore((state) => state.setChannels)
  const setIsAuthenticated = usePersistStore(
    (state) => state.setIsAuthenticated
  )
  const setSelectedChannel = useAppStore((state) => state.setSelectedChannel)
  const setIsSignedUser = usePersistStore((state) => state.setIsSignedUser)
  const setSelectedChannelId = usePersistStore(
    (state) => state.setSelectedChannelId
  )

  const { signMessageAsync, isLoading: signing } = useSignMessage({
    onError(error: any) {
      toast.error(error?.data?.message ?? error?.message)
    }
  })

  const [loadChallenge, { error: errorChallenge, loading: loadingChallenge }] =
    useLazyQuery(CHALLENGE_QUERY, {
      fetchPolicy: 'no-cache' // if cache old challenge persist issue (InvalidSignature)
    })
  const [authenticate, { error: errorAuthenticate }] = useMutation(
    AUTHENTICATE_MUTATION
  )
  const [getChannels, { error: errorProfiles }] = useLazyQuery(PROFILES_QUERY, {
    fetchPolicy: 'no-cache'
  })

  useEffect(() => {
    if (
      errorAuthenticate?.message ||
      errorChallenge?.message ||
      errorProfiles?.message
    )
      toast.error(
        errorAuthenticate?.message ||
          errorChallenge?.message ||
          errorProfiles?.message ||
          ERROR_MESSAGE
      )
  }, [errorAuthenticate, errorChallenge, errorProfiles])

  const handleSign = async () => {
    try {
      const challenge = await loadChallenge({
        variables: { request: { address } }
      })
      if (!challenge?.data?.challenge?.text) return toast.error(ERROR_MESSAGE)
      const signature = await signMessageAsync({
        message: challenge?.data?.challenge?.text
      })
      const result = await authenticate({
        variables: { request: { address, signature } }
      })
      const accessToken = result.data.authenticate.accessToken
      const refreshToken = result.data.authenticate.refreshToken
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      const { data: channelsData } = await getChannels({
        variables: { ownedBy: address }
      })
      setIsSignedUser(true)
      if (
        !channelsData?.profiles ||
        channelsData?.profiles?.items.length === 0
      ) {
        setSelectedChannel(null)
        setSelectedChannelId(null)
        setIsAuthenticated(false)
        setShowCreateChannel(true)
      } else {
        const channels: Profile[] = channelsData?.profiles?.items
        setChannels(channels)
        setSelectedChannel(channels[0])
        setSelectedChannelId(channels[0].id)
        setIsAuthenticated(true)
        if (router.query?.next) router.push(router.query?.next as string)
      }
    } catch (error) {
      logger.error('[Error Sign In]', error)
    }
  }

  return (
    <ConnectWalletButton
      handleSign={handleSign}
      signing={signing || loadingChallenge}
    />
  )
}

export default Login
