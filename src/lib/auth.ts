/**
 * Serviço de Autenticação
 * 
 * Este serviço gerencia a autenticação de usuários no frontend,
 * incluindo login, logout e armazenamento de tokens JWT.
 */

export interface AuthUser {
  id: number
  nome: string
  email: string
  perfil_id: number
  perfil: {
    id: number
    nome: string
    descricao?: string | null
  }
}

export interface LoginResponse {
  success: boolean
  data?: {
    token: string
    usuario: AuthUser
  }
  error?: {
    code: string
    message: string
  }
}

/**
 * Classe de serviço de autenticação
 */
export class AuthService {
  private static readonly TOKEN_KEY = 'auth_token'
  private static readonly USER_KEY = 'auth_user'

  /**
   * Faz login do usuário
   * 
   * @param email - Email do usuário
   * @param password - Senha do usuário
   * @returns Resposta do login
   */
  static async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data: LoginResponse = await response.json()

      if (data.success && data.data) {
        // Armazenar token e usuário no localStorage
        this.setToken(data.data.token)
        this.setUser(data.data.usuario)
      }

      return data
    } catch (error) {
      console.error('Erro ao fazer login:', error)
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Erro de conexão. Tente novamente.'
        }
      }
    }
  }

  /**
   * Faz logout do usuário
   */
  static logout(): void {
    // Remover token e usuário do localStorage
    localStorage.removeItem(this.TOKEN_KEY)
    localStorage.removeItem(this.USER_KEY)

    // Redirecionar para página de login
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  /**
   * Verifica se o usuário está autenticado
   * 
   * @returns true se estiver autenticado, false caso contrário
   */
  static isAuthenticated(): boolean {
    const token = this.getToken()
    return !!token
  }

  /**
   * Obtém o token JWT armazenado
   * 
   * @returns Token JWT ou null
   */
  static getToken(): string | null {
    if (typeof window === 'undefined') {
      return null
    }

    return localStorage.getItem(this.TOKEN_KEY)
  }

  /**
   * Define o token JWT
   * 
   * @param token - Token JWT
   */
  static setToken(token: string): void {
    if (typeof window === 'undefined') {
      return
    }

    localStorage.setItem(this.TOKEN_KEY, token)
  }

  /**
   * Obtém os dados do usuário autenticado
   * 
   * @returns Dados do usuário ou null
   */
  static getUser(): AuthUser | null {
    if (typeof window === 'undefined') {
      return null
    }

    const userJson = localStorage.getItem(this.USER_KEY)
    if (!userJson) {
      return null
    }

    try {
      return JSON.parse(userJson)
    } catch (error) {
      console.error('Erro ao parsear usuário:', error)
      return null
    }
  }

  /**
   * Define os dados do usuário
   * 
   * @param user - Dados do usuário
   */
  static setUser(user: AuthUser): void {
    if (typeof window === 'undefined') {
      return
    }

    localStorage.setItem(this.USER_KEY, JSON.stringify(user))
  }

  /**
   * Obtém o nome do usuário
   * 
   * @returns Nome do usuário ou null
   */
  static getUserName(): string | null {
    const user = this.getUser()
    return user?.nome || null
  }

  /**
   * Obtém o email do usuário
   * 
   * @returns Email do usuário ou null
   */
  static getUserEmail(): string | null {
    const user = this.getUser()
    return user?.email || null
  }

  /**
   * Verifica se o usuário tem um perfil específico
   * 
   * @param perfilId - ID do perfil
   * @returns true se tiver o perfil, false caso contrário
   */
  static hasPerfil(perfilId: number): boolean {
    const user = this.getUser()
    return user?.perfil_id === perfilId || false
  }

  /**
   * Verifica se o usuário é administrador
   * 
   * @returns true se for administrador, false caso contrário
   */
  static isAdmin(): boolean {
    return this.hasPerfil(1)
  }
}
