/**
 * Hook useFetch para Requisições Autenticadas
 * 
 * Este hook fornece uma função fetch que automaticamente inclui
 * o token JWT nos headers de todas as requisições.
 */

import { useCallback } from 'react'
import { AuthService } from '@/lib/auth'

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>
}

export function useFetch() {
  const authenticatedFetch = useCallback(async (url: string, options: FetchOptions = {}) => {
    const token = AuthService.getToken()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    // Adicionar token de autenticação se disponível
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      ...options,
      headers
    })

    return response
  }, [])

  return { fetch: authenticatedFetch }
}
