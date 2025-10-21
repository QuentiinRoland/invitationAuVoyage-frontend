import React, { useState } from 'react';
import { useAuth } from '../../contexts/SimpleAuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Loader2 } from 'lucide-react';

interface RealLoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  onSwitchToForgotPassword?: () => void;
}

const RealLoginForm: React.FC<RealLoginFormProps> = ({ onSuccess, onSwitchToRegister, onSwitchToForgotPassword }) => {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors) setErrors('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors('');

    try {
      await login(formData.email, formData.password);
      onSuccess?.();
    } catch (error: any) {
      setErrors(error.message);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1 text-center">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-primary-foreground font-bold text-lg">IV</span>
        </div>
        <CardTitle className="text-2xl font-bold">Bienvenue</CardTitle>
        <CardDescription>
          Connectez-vous à votre compte Invitation au Voyage
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
              {errors}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Adresse email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="nom@example.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion...
              </>
            ) : (
              'Se connecter'
            )}
          </Button>
        </form>

        <div className="space-y-4">
          {onSwitchToForgotPassword && (
            <div className="text-center">
              <Button
                variant="link"
                onClick={onSwitchToForgotPassword}
                className="text-sm text-muted-foreground p-0 h-auto"
              >
                Mot de passe oublié ?
              </Button>
            </div>
          )}

          {onSwitchToRegister && (
            <div className="text-center text-sm text-muted-foreground">
              Pas encore de compte ?{' '}
              <Button
                variant="link"
                onClick={onSwitchToRegister}
                className="p-0 h-auto font-medium"
              >
                S'inscrire
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RealLoginForm;
