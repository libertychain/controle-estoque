/**
 * Utilitário de Hash de Senha
 * 
 * Este módulo fornece funções para criar e verificar hashes de senha
 * usando o módulo crypto do Node.js com scrypt para segurança.
 */

import crypto from 'crypto'

/**
 * Cria um hash seguro para uma senha
 * 
 * @param password - Senha em texto plano
 * @returns Hash da senha com salt
 */
export async function hashPassword(password: string): Promise<string> {
  // Gerar um salt aleatório
  const salt = crypto.randomBytes(16).toString('hex')
  
  // Usar scrypt para criar o hash (mais seguro que bcrypt)
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  
  // Retornar salt + hash separados por ':'
  return `${salt}:${hash}`
}

/**
 * Verifica se uma senha corresponde a um hash
 * 
 * @param password - Senha em texto plano
 * @param hashedPassword - Hash da senha com salt
 * @returns true se a senha estiver correta, false caso contrário
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    // Separar salt e hash
    const [salt, hash] = hashedPassword.split(':')
    
    if (!salt || !hash) {
      return false
    }
    
    // Criar hash da senha fornecida com o mesmo salt
    const computedHash = crypto.scryptSync(password, salt, 64).toString('hex')
    
    // Comparar hashes
    return computedHash === hash
  } catch (error) {
    console.error('Erro ao verificar senha:', error)
    return false
  }
}
