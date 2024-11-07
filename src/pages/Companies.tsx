import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Parse from '../config/parseConfig';
import { format, isAfter } from 'date-fns';
import toast from 'react-hot-toast';
import { PencilIcon, TrashIcon, ArrowPathIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface Company {
  id: string;
  cnpj: string;
  razaoSocial: string;
  certificateFile?: File;
  certificateValidity: Date;
  certificatePassword: string;
}

export default function Companies() {
  const { currentUser } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    cnpj: '',
    showExpired: false
  });
  const [formData, setFormData] = useState({
    cnpj: '',
    razaoSocial: '',
    certificateFile: null as File | null,
    certificatePassword: ''
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [companies, filters]);

  const applyFilters = () => {
    let result = [...companies];
    const now = new Date();

    if (filters.cnpj) {
      result = result.filter(company => 
        company.cnpj.toLowerCase().includes(filters.cnpj.toLowerCase())
      );
    }

    if (filters.showExpired) {
      result = result.filter(company => 
        !isAfter(new Date(company.certificateValidity), now)
      );
    }

    setFilteredCompanies(result);
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const Company = Parse.Object.extend('Company');
      const query = new Parse.Query(Company);
      query.equalTo('user', currentUser);
      const results = await query.find();
      
      const companiesList = results.map(company => ({
        id: company.id,
        cnpj: company.get('cnpj'),
        razaoSocial: company.get('razaoSocial'),
        certificateValidity: company.get('certificateValidity'),
        certificatePassword: company.get('certificatePassword')
      }));

      setCompanies(companiesList);
      setFilteredCompanies(companiesList);
    } catch (error) {
      toast.error('Falha ao carregar empresas');
    } finally {
      setLoading(false);
    }
  };

  const validateCertificate = (file: File): Promise<Date> => {
    return new Promise((resolve, reject) => {
      if (!file.name.endsWith('.pfx')) {
        reject(new Error('Formato de certificado inválido. Deve ser .pfx'));
      }
      resolve(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const Company = Parse.Object.extend('Company');
      let company: Parse.Object;

      if (editingCompany) {
        const query = new Parse.Query(Company);
        company = await query.get(editingCompany.id);
      } else {
        if (!formData.certificateFile) {
          throw new Error('Arquivo de certificado é obrigatório');
        }
        company = new Company();
        company.set('user', currentUser);
        company.set('cnpj', formData.cnpj);
      }

      if (formData.certificateFile) {
        const validityDate = await validateCertificate(formData.certificateFile);
        const certificateData = new Parse.File(
          formData.certificateFile.name,
          formData.certificateFile
        );
        company.set('certificateFile', certificateData);
        company.set('certificateValidity', validityDate);
      }

      if (formData.razaoSocial) {
        company.set('razaoSocial', formData.razaoSocial);
      }

      if (formData.certificatePassword) {
        company.set('certificatePassword', formData.certificatePassword);
      }

      await company.save();
      
      toast.success(editingCompany ? 'Empresa atualizada com sucesso' : 'Empresa adicionada com sucesso');
      setFormData({
        cnpj: '',
        razaoSocial: '',
        certificateFile: null,
        certificatePassword: ''
      });
      setEditingCompany(null);
      fetchCompanies();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao salvar empresa');
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      cnpj: company.cnpj,
      razaoSocial: company.razaoSocial,
      certificateFile: null,
      certificatePassword: ''
    });
  };

  const handleDelete = async (companyId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta empresa?')) {
      try {
        const Company = Parse.Object.extend('Company');
        const query = new Parse.Query(Company);
        const company = await query.get(companyId);
        await company.destroy();
        toast.success('Empresa excluída com sucesso');
        fetchCompanies();
      } catch (error) {
        toast.error('Falha ao excluir empresa');
      }
    }
  };

  const cancelEdit = () => {
    setEditingCompany(null);
    setFormData({
      cnpj: '',
      razaoSocial: '',
      certificateFile: null,
      certificatePassword: ''
    });
  };

  const isCertificateExpired = (validityDate: Date) => {
    return !isAfter(new Date(validityDate), new Date());
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="max-w-3xl mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-2xl font-bold mb-8">
                  {editingCompany ? 'Editar Empresa' : 'Adicionar Nova Empresa'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CNPJ</label>
                    <input
                      type="text"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required={!editingCompany}
                      disabled={!!editingCompany}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Razão Social</label>
                    <input
                      type="text"
                      value={formData.razaoSocial}
                      onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required={!editingCompany}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {editingCompany ? 'Novo Certificado Digital (.pfx)' : 'Certificado Digital (.pfx)'}
                    </label>
                    <input
                      type="file"
                      accept=".pfx"
                      onChange={(e) => setFormData({ ...formData, certificateFile: e.target.files?.[0] || null })}
                      className="mt-1 block w-full"
                      required={!editingCompany}
                    />
                    {editingCompany && (
                      <p className="mt-1 text-sm text-gray-500">
                        Deixe em branco para manter o certificado atual
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Senha do Certificado</label>
                    <input
                      type="password"
                      value={formData.certificatePassword}
                      onChange={(e) => setFormData({ ...formData, certificatePassword: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required={!editingCompany}
                    />
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {editingCompany ? 'Salvar Alterações' : 'Adicionar Empresa'}
                    </button>
                    {editingCompany && (
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>
              
              <div className="pt-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">Lista de Empresas</h3>
                    <button
                      onClick={fetchCompanies}
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Atualizar Lista
                    </button>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Filtrar por CNPJ
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={filters.cnpj}
                            onChange={(e) => setFilters({ ...filters, cnpj: e.target.value })}
                            placeholder="Digite o CNPJ"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                          <FunnelIcon className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                        </div>
                      </div>
                      <div className="flex items-end">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.showExpired}
                            onChange={(e) => setFilters({ ...filters, showExpired: e.target.checked })}
                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
                          />
                          <span className="ml-2 text-sm text-gray-700">Mostrar apenas certificados vencidos</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNPJ</th>
                        <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razão Social</th>
                        <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validade do Certificado</th>
                        <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredCompanies.map((company) => {
                        const expired = isCertificateExpired(company.certificateValidity);
                        return (
                          <tr key={company.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{company.cnpj}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{company.razaoSocial}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {format(new Date(company.certificateValidity), 'dd/MM/yyyy')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                expired
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {expired ? 'Vencido' : 'Válido'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex space-x-4">
                                <button
                                  onClick={() => handleEdit(company)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  <PencilIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(company.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}