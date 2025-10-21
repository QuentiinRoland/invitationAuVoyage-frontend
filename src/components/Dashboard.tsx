import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  FileText, 
  Upload, 
  FolderOpen, 
  TrendingUp, 
  Clock, 
  Plus,
  ArrowRight
} from 'lucide-react';
import { api } from '../api/client';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  isActive?: boolean;
}

interface DashboardStats {
  totalDocuments: number;
  recentDocuments: Array<{
    id: number;
    title: string;
    created_at: string;
    document_type_display: string;
  }>;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, isActive = false }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    recentDocuments: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Recharger les données toutes les 30 secondes
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Écouter les changements de focus pour recharger
  useEffect(() => {
    const handleFocus = () => loadDashboardData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Recharger quand le dashboard devient actif
  useEffect(() => {
    if (isActive) {
      loadDashboardData();
    }
  }, [isActive]);

  const loadDashboardData = async () => {
    try {
      const response = await api.get('api/documents/');
      const documents = response.data;
      setStats({
        totalDocuments: documents.length,
        recentDocuments: documents
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
      });
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      // En cas d'erreur, afficher un état vide
      setStats({
        totalDocuments: 0,
        recentDocuments: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const quickActions = [
    {
      title: 'Créer une nouvelle offre',
      description: 'Générez une offre personnalisée à partir de votre texte',
      icon: Plus,
      action: () => onNavigate('text-to-offer'),
      color: 'bg-blue-500'
    },
    {
      title: 'Importer un PDF',
      description: 'Convertissez vos documents PDF existants',
      icon: Upload,
      action: () => onNavigate('pdf-import'),
      color: 'bg-green-500'
    },
    {
      title: 'Parcourir mes documents',
      description: 'Accédez à tous vos documents sauvegardés',
      icon: FolderOpen,
      action: () => onNavigate('document-library'),
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenue dans votre espace de création d'offres
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 mb-4">
            <div className="text-sm font-medium text-muted-foreground">Documents créés</div>
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">
            {isLoading ? '...' : stats.totalDocuments}
          </div>
          <p className="text-sm text-muted-foreground">
            Total de vos documents
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 mb-4">
            <div className="text-sm font-medium text-muted-foreground">Activité récente</div>
            <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">
            {isLoading ? '...' : stats.recentDocuments.length}
          </div>
          <p className="text-sm text-muted-foreground">
            Documents cette semaine
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 mb-4">
            <div className="text-sm font-medium text-muted-foreground">Dernière action</div>
            <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">
            {isLoading ? '...' : (stats.recentDocuments.length > 0 ? 'Aujourd\'hui' : 'Aucune')}
          </div>
          <p className="text-sm text-muted-foreground">
            Dernière création
          </p>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>
            Commencez rapidement votre prochain projet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-start space-y-3 text-left hover:bg-accent/30 border-border/40 hover:border-primary/20"
                  onClick={action.action}
                >
                  <div className={`w-10 h-10 rounded-2xl ${action.color} flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.1)]`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <p className="font-semibold text-sm text-foreground">{action.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{action.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Documents récents</CardTitle>
              <CardDescription>
                Vos derniers documents créés
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate('document-library')}>
              Voir tous
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-muted rounded animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-1/4 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : stats.recentDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun document créé pour le moment</p>
              <Button className="mt-4" onClick={() => onNavigate('text-to-offer')}>
                Créer votre première offre
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(doc.created_at)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {doc.document_type_display}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
