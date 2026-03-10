/**
 * Script para Criar Usuário Administrador Padrão
 * 
 * Este script cria um usuário administrador padrão para testes iniciais.
 * Execute com: node seed-admin.js
 */

const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

const prisma = new PrismaClient()

/**
 * Cria um hash seguro para uma senha
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

async function main() {
  try {
    console.log('🚀 Iniciando criação de usuário administrador...')

    // Verificar se já existe um usuário administrador
    const existingAdmin = await prisma.usuario.findFirst({
      where: {
        email: 'admin@localhost'
      }
    })

    if (existingAdmin) {
      console.log('⚠️  Usuário administrador já existe!')
      console.log('📧 Email: admin@localhost')
      console.log('🔑 Senha: admin123')
      console.log('ℹ️  Se você quiser redefinir a senha, exclua o usuário e execute este script novamente.')
      return
    }

    // Verificar se o perfil de administrador existe
    let adminPerfil = await prisma.perfil.findFirst({
      where: {
        nome: 'Administrador'
      }
    })

    if (!adminPerfil) {
      console.log('📝 Criando perfil de administrador...')
      adminPerfil = await prisma.perfil.create({
        data: {
          nome: 'Administrador',
          descricao: 'Acesso completo ao sistema'
        }
      })
      console.log('✅ Perfil de administrador criado!')
    }

    // Criar usuário administrador
    const senhaHash = hashPassword('admin123')
    
    const adminUser = await prisma.usuario.create({
      data: {
        nome: 'Administrador do Sistema',
        email: 'admin@localhost',
        senha: senhaHash,
        perfil_id: adminPerfil.id,
        ativo: true
      }
    })

    console.log('✅ Usuário administrador criado com sucesso!')
    console.log('📧 Email: admin@localhost')
    console.log('🔑 Senha: admin123')
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!')
  } catch (error) {
    console.error('❌ Erro ao criar usuário administrador:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
