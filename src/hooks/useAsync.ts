import { useState, useCallback } from 'react'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseAsyncReturn<T> extends AsyncState<T> {
  execute: (...args: any[]) => Promise<T | null>
  reset: () => void
  setData: (data: T | null) => void
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
}

export function useAsync<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  immediate: boolean = false
): UseAsyncReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null
  })

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      const result = await asyncFunction(...args)
      setState(prev => ({ ...prev, data: result, loading: false }))
      return result
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Erro inesperado'
      setState(prev => ({ ...prev, error: errorMessage, loading: false }))
      return null
    }
  }, [asyncFunction])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    })
  }, [])

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }))
  }, [])

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
    setLoading
  }
}
