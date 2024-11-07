import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Parse from '../config/parseConfig';
import toast from 'react-hot-toast';
import { Listbox } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';

interface XmlSaida {
  id: string;
  cnpj: string;
  chavenfe: string;
  valornf: string;
  razaoSocial: string;
  valorNumerico: number;
}

interface Company {
  cnpj: string;
  razaoSocial: string;
}

export default function XmlsDownloaded() {
  const { currentUser } = useAuth();
  const [xmls, setXmls] = useState<XmlSaida[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchCompanies();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchXmls(selectedCompanies.map(c => c.cnpj));
    }
  }, [currentUser, selectedCompanies]);

  const fetchCompanies = async () => {
    try {
      const Company = Parse.Object.extend('Company');
      const query = new Parse.Query(Company);
      query.equalTo('user', currentUser);
      const results = await query.find();
      
      const companyList = results.map(company => ({
        cnpj: company.get('cnpj'),
        razaoSocial: company.get('razaoSocial')
      }));
      
      setCompanies(companyList);
      setSelectedCompanies([]); // Start with no companies selected
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Falha ao carregar empresas');
    }
  };

  const formatCurrency = (value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const fetchXmls = async (filterCnpjs: string[]) => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const XmlSaida = Parse.Object.extend('xmlssaida');
      const xmlQuery = new Parse.Query(XmlSaida);
      
      const userPointer = Parse.User.createWithoutData(currentUser.id);
      xmlQuery.equalTo('user', userPointer);
      
      if (filterCnpjs.length > 0) {
        xmlQuery.containedIn('cnpj', filterCnpjs);
      }
      
      xmlQuery.limit(100);
      xmlQuery.descending('createdAt');
      
      const results = await xmlQuery.find();
      
      const companyMap = new Map(
        companies.map(company => [company.cnpj, company.razaoSocial])
      );
      
      const parsedXmls = results.map(xml => {
        const cnpj = xml.get('cnpj') || '';
        const valorNumerico = parseFloat(xml.get('valornf')) || 0;
        return {
          id: xml.id,
          cnpj,
          chavenfe: xml.get('chavenfe') || '',
          razaoSocial: companyMap.get(cnpj) || 'Empresa não cadastrada',
          valornf: formatCurrency(valorNumerico),
          valorNumerico
        };
      });

      setXmls(parsedXmls);
    } catch (error) {
      console.error('Error fetching XMLs:', error);
      toast.error('Falha ao carregar XMLs');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (selectedCompanies: Company[]) => {
    setSelectedCompanies(selectedCompanies);
  };

  const handleRefresh = () => {
    fetchXmls(selectedCompanies.map(c => c.cnpj));
  };

  const totalValue = xmls.reduce((sum, xml) => sum + xml.valorNumerico, 0);

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">XMLs Baixados</h2>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
          >
            Atualizar Lista
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filtrar por Empresas (Selecione uma ou mais)
          </label>
          <Listbox value={selectedCompanies} onChange={handleCompanyChange} multiple>
            <div className="relative mt-1">
              <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-300 sm:text-sm min-h-[38px]">
                <span className="block truncate">
                  {selectedCompanies.length === 0
                    ? 'Selecione as empresas'
                    : selectedCompanies.map(company => company.razaoSocial).join(', ')}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>
              <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
                {companies.map((company, index) => (
                  <Listbox.Option
                    key={index}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'
                      }`
                    }
                    value={company}
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {company.razaoSocial} ({company.cnpj})
                        </span>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Carregando...</div>
          ) : xmls.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Nenhum XML encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CNPJ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Razão Social
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chave NFE
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor NF
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {xmls.map((xml) => (
                    <tr key={xml.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {xml.cnpj}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {xml.razaoSocial}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {xml.chavenfe}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {xml.valornf}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      Total:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {formatCurrency(totalValue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}