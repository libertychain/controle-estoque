const { PrismaClient } = require('@prisma/client');

async function seedSecretarias() {
  const db = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./db/custom.db'
      }
    }
  });
  
  try {
    console.log('Criando secretarias e setores...');
    
    // Criar secretarias
    const secretarias = await db.secretaria.createMany({
      data: [
        {
          nome: 'Secretaria de Educação',
          sigla: 'SEDUC'
        },
        {
          nome: 'Secretaria de Saúde',
          sigla: 'SAÚDE'
        },
        {
          nome: 'Secretaria de Finanças',
          sigla: 'SEFIN'
        },
        {
          nome: 'Secretaria de Obras',
          sigla: 'SOBRA'
        },
        {
          nome: 'Secretaria de Administração',
          sigla: 'SEADM'
        }
      ]
    });
    
    console.log(`✓ ${secretarias.count} secretarias criadas`);
    
    // Buscar secretarias criadas
    const secretariasCriadas = await db.secretaria.findMany();
    
    // Criar setores para cada secretaria
    const setoresData = [
      // Secretaria de Educação
      { secretaria_id: secretariasCriadas[0].id, nome: 'Departamento de Ensino Fundamental' },
      { secretaria_id: secretariasCriadas[0].id, nome: 'Departamento de Ensino Médio' },
      { secretaria_id: secretariasCriadas[0].id, nome: 'Departamento de Educação Infantil' },
      { secretaria_id: secretariasCriadas[0].id, nome: 'Coordenação de Transporte Escolar' },
      // Secretaria de Saúde
      { secretaria_id: secretariasCriadas[1].id, nome: 'Departamento de Nutrição' },
      { secretaria_id: secretariasCriadas[1].id, nome: 'Departamento de Farmácia' },
      { secretaria_id: secretariasCriadas[1].id, nome: 'Unidade Básica de Saúde Central' },
      { secretaria_id: secretariasCriadas[1].id, nome: 'Hospital Municipal' },
      // Secretaria de Finanças
      { secretaria_id: secretariasCriadas[2].id, nome: 'Departamento de Contabilidade' },
      { secretaria_id: secretariasCriadas[2].id, nome: 'Departamento de Tesouraria' },
      { secretaria_id: secretariasCriadas[2].id, nome: 'Departamento de Compras' },
      { secretaria_id: secretariasCriadas[2].id, nome: 'Departamento de Licitações' },
      // Secretaria de Obras
      { secretaria_id: secretariasCriadas[3].id, nome: 'Departamento de Engenharia' },
      { secretaria_id: secretariasCriadas[3].id, nome: 'Departamento de Manutenção' },
      { secretaria_id: secretariasCriadas[3].id, nome: 'Departamento de Urbanismo' },
      // Secretaria de Administração
      { secretaria_id: secretariasCriadas[4].id, nome: 'Departamento de Recursos Humanos' },
      { secretaria_id: secretariasCriadas[4].id, nome: 'Departamento de Material e Patrimônio' },
      { secretaria_id: secretariasCriadas[4].id, nome: 'Departamento de Almoxarifado' },
      { secretaria_id: secretariasCriadas[4].id, nome: 'Departamento de Protocolo' }
    ];
    
    const setores = await db.setor.createMany({
      data: setoresData
    });
    
    console.log(`✓ ${setores.count} setores criados`);
    console.log('\n✓ Seed concluído com sucesso!');
    
  } catch (error) {
    console.error('✗ Erro ao criar secretarias e setores:');
    console.error(error.message);
  } finally {
    await db.$disconnect();
  }
}

seedSecretarias();
