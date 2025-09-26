import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, MapPin, Star, Globe } from 'lucide-react';

interface Developer {
  rank: number;
  name: string;
  nameRu: string;
  url: string;
  keyProjects: string;
  websiteFeatures: string;
}

const developers: Developer[] = [
  {
    rank: 1,
    name: "Emaar Properties",
    nameRu: "Эмаар Пропертис",
    url: "emaar.com",
    keyProjects: "Burj Khalifa, Dubai Mall",
    websiteFeatures: "3D туры, интерактивная карта, видеозвонки"
  },
  {
    rank: 2,
    name: "Damac Properties",
    nameRu: "Дамак Пропертис",
    url: "damac.com",
    keyProjects: "Роскошные проекты",
    websiteFeatures: "VR туры, многоязычность (EN/AR/RU)"
  },
  {
    rank: 3,
    name: "Nakheel",
    nameRu: "Нахиль",
    url: "nakheel.com",
    keyProjects: "Palm Jumeirah, Deira Islands",
    websiteFeatures: "Онлайн-сервисы, живой чат"
  },
  {
    rank: 4,
    name: "Dubai Properties",
    nameRu: "Дубай Пропертис",
    url: "dubaiproperties.ae",
    keyProjects: "Часть Dubai Holding",
    websiteFeatures: "Цифровая интеграция"
  },
  {
    rank: 5,
    name: "Emirates National Investment",
    nameRu: "Эмиратс Нешнл Инвестмент",
    url: "eni.ae",
    keyProjects: "Роскошные проекты",
    websiteFeatures: "Элегантный дизайн"
  },
  {
    rank: 6,
    name: "Prestige",
    nameRu: "Престиж",
    url: "prestige.ae",
    keyProjects: "Премиум недвижимость",
    websiteFeatures: "Элегантный интерфейс"
  },
  {
    rank: 7,
    name: "Betterhomes",
    nameRu: "Беттерхоумс",
    url: "betterhomes.com",
    keyProjects: "Агентские услуги",
    websiteFeatures: "Удобная навигация"
  },
  {
    rank: 8,
    name: "Deyaar",
    nameRu: "Деяар",
    url: "deyaar.ae",
    keyProjects: "Жилые комплексы",
    websiteFeatures: "Контроль поиска"
  },
  {
    rank: 9,
    name: "Al Fattan",
    nameRu: "Аль Фаттан",
    url: "alfattan.com",
    keyProjects: "Многофункциональные проекты",
    websiteFeatures: "Бесшовная навигация"
  },
  {
    rank: 10,
    name: "Wasl Properties",
    nameRu: "Васл Пропертис",
    url: "waslproperties.com",
    keyProjects: "Государственные проекты",
    websiteFeatures: "Многоязычность"
  }
];

const Developers = () => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-2">Топ-10 застройщиков Дубая</h3>
        <p className="text-muted-foreground">
          Ведущие девелоперские компании с лучшими онлайн-платформами
        </p>
      </div>

      <div className="grid gap-4">
        {developers.map((developer) => (
          <Card key={developer.rank} className="transition-all hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
                    #{developer.rank}
                  </Badge>
                  <div>
                    <h4 className="text-xl font-semibold">{developer.name}</h4>
                    <p className="text-sm text-muted-foreground">{developer.nameRu}</p>
                  </div>
                </div>
                <a
                  href={`https://${developer.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  {developer.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Ключевые проекты</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    {developer.keyProjects}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Особенности сайта</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    {developer.websiteFeatures}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Почему эти застройщики лидируют?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-2">100%</div>
              <p className="text-sm text-muted-foreground">
                Цифровая трансформация
              </p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-2">24/7</div>
              <p className="text-sm text-muted-foreground">
                Онлайн поддержка клиентов
              </p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">VR/AR</div>
              <p className="text-sm text-muted-foreground">
                Инновационные технологии
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Developers;