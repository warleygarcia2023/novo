import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Parse from '../config/parseConfig';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardData {
  totalXmls: number;
  totalCompanies: number;
  validCertificates: number;
  expiredCertificates: number;
  xmlsByCompany: {
    labels: string[];
    values: number[];
  };
}

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [data, setData] = useState<DashboardData>({
    totalXmls: 0,
    totalCompanies: 0,
    validCertificates: 0,
    expiredCertificates: 0,
    xmlsByCompany: {
      labels: [],
      values: []
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch XMLs count
        const xmlQuery = new Parse.Query('xmlssaida');
        xmlQuery.equalTo('user', currentUser?.id);
        const totalXmls = await xmlQuery.count();

        // Fetch companies and check certificates
        const companyQuery = new Parse.Query('Company');
        companyQuery.equalTo('user', currentUser);
        const companies = await companyQuery.find();
        
        const now = new Date();
        const validCertificates = companies.filter(
          company => new Date(company.get('certificateValidity')) > now
        ).length;
        
        // Prepare data for company XML totals chart
        const xmlsByCompanyQuery = new Parse.Query('xmlssaida');
        xmlsByCompanyQuery.equalTo('user', currentUser?.id);
        xmlsByCompanyQuery.include('company');
        const xmlsData = await xmlsByCompanyQuery.find();
        
        const xmlTotals = xmlsData.reduce((acc: { [key: string]: number }, xml: Parse.Object) => {
          const cnpj = xml.get('cnpj');
          const valor = parseFloat(xml.get('valornf') || 0);
          acc[cnpj] = (acc[cnpj] || 0) + valor;
          return acc;
        }, {});

        const sortedEntries = Object.entries(xmlTotals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        setData({
          totalXmls,
          totalCompanies: companies.length,
          validCertificates,
          expiredCertificates: companies.length - validCertificates,
          xmlsByCompany: {
            labels: sortedEntries.map(([cnpj]) => cnpj),
            values: sortedEntries.map(([, value]) => value)
          }
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Erro ao carregar dados do dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const certificateData = {
    labels: ['Válidos', 'Vencidos'],
    datasets: [
      {
        data: [data.validCertificates, data.expiredCertificates],
        backgroundColor: ['#059669', '#DC2626'],
        borderWidth: 0,
      },
    ],
  };

  const xmlsData = {
    labels: data.xmlsByCompany.labels,
    datasets: [
      {
        label: 'Total em R$',
        data: data.xmlsByCompany.values,
        backgroundColor: '#4F46E5',
        borderColor: '#4338CA',
        borderWidth: 1,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
    cutout: '60%',
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => {
            return new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              maximumFractionDigits: 0,
            }).format(value);
          },
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total de XMLs</h3>
          <p className="text-3xl font-bold text-indigo-600">{data.totalXmls}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total de Empresas</h3>
          <p className="text-3xl font-bold text-indigo-600">{data.totalCompanies}</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Certificados Válidos</h3>
          <p className="text-3xl font-bold text-green-600">{data.validCertificates}</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Certificados Vencidos</h3>
          <p className="text-3xl font-bold text-red-600">{data.expiredCertificates}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Status dos Certificados</h3>
          <div className="h-[300px] flex items-center justify-center">
            <Doughnut data={certificateData} options={doughnutOptions} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Top 5 - Total de Notas por Empresa</h3>
          <div className="h-[300px]">
            <Bar data={xmlsData} options={barOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}