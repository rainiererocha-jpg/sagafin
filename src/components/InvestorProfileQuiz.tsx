import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  TrendingUp,
  Rocket,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScaleIn } from "@/components/ui/motion";

interface Question {
  id: number;
  question: string;
  options: { text: string; points: number }[];
}

const questions: Question[] = [
  {
    id: 1,
    question: "Qual é o seu principal objetivo ao investir?",
    options: [
      { text: "Preservar meu capital e ter liquidez", points: 1 },
      { text: "Crescimento moderado com alguma segurança", points: 2 },
      { text: "Maximizar retornos, mesmo com riscos", points: 3 },
    ],
  },
  {
    id: 2,
    question: "Se seu investimento caísse 15% em um mês, o que você faria?",
    options: [
      { text: "Venderia tudo imediatamente", points: 1 },
      { text: "Esperaria um pouco para ver se recupera", points: 2 },
      { text: "Aproveitaria para comprar mais", points: 3 },
    ],
  },
  {
    id: 3,
    question: "Por quanto tempo pretende deixar o dinheiro investido?",
    options: [
      { text: "Menos de 2 anos", points: 1 },
      { text: "Entre 2 e 5 anos", points: 2 },
      { text: "Mais de 5 anos", points: 3 },
    ],
  },
  {
    id: 4,
    question: "Qual porcentagem da sua renda mensal você pode investir?",
    options: [
      { text: "Até 10%", points: 1 },
      { text: "Entre 10% e 30%", points: 2 },
      { text: "Mais de 30%", points: 3 },
    ],
  },
  {
    id: 5,
    question: "Qual sua experiência com investimentos?",
    options: [
      { text: "Nunca investi além da poupança", points: 1 },
      { text: "Já investi em CDBs e Tesouro Direto", points: 2 },
      { text: "Tenho experiência com ações e fundos", points: 3 },
    ],
  },
  {
    id: 6,
    question: "Como você se sente em relação a oscilações do mercado?",
    options: [
      { text: "Fico muito preocupado e perco o sono", points: 1 },
      { text: "Fico atento mas não me desespero", points: 2 },
      { text: "Vejo como oportunidade de ganhos", points: 3 },
    ],
  },
  {
    id: 7,
    question: "Qual é a sua reserva de emergência atual?",
    options: [
      { text: "Não tenho ou tenho menos de 3 meses", points: 1 },
      { text: "Tenho entre 3 e 6 meses de despesas", points: 2 },
      { text: "Tenho mais de 6 meses de despesas", points: 3 },
    ],
  },
];

type Profile = "conservador" | "moderado" | "arrojado";

interface ProfileResult {
  type: Profile;
  title: string;
  description: string;
  allocation: { asset: string; percentage: number }[];
  icon: typeof Shield;
  color: string;
}

const profiles: Record<Profile, ProfileResult> = {
  conservador: {
    type: "conservador",
    title: "Perfil Conservador",
    description:
      "Você prioriza a segurança do seu capital e prefere investimentos de baixo risco. Sua estratégia ideal foca em renda fixa e ativos com menor volatilidade.",
    allocation: [
      { asset: "Renda Fixa", percentage: 70 },
      { asset: "Fundos Multimercado", percentage: 20 },
      { asset: "Renda Variável", percentage: 10 },
    ],
    icon: Shield,
    color: "text-blue-400",
  },
  moderado: {
    type: "moderado",
    title: "Perfil Moderado",
    description:
      "Você busca um equilíbrio entre segurança e rentabilidade. Aceita alguma oscilação em troca de retornos potencialmente maiores no médio prazo.",
    allocation: [
      { asset: "Renda Fixa", percentage: 45 },
      { asset: "Fundos Multimercado", percentage: 25 },
      { asset: "Renda Variável", percentage: 30 },
    ],
    icon: TrendingUp,
    color: "text-gold",
  },
  arrojado: {
    type: "arrojado",
    title: "Perfil Arrojado",
    description:
      "Você tem alta tolerância a riscos e foco no longo prazo. Busca maximizar retornos e está preparado para enfrentar volatilidade do mercado.",
    allocation: [
      { asset: "Renda Fixa", percentage: 20 },
      { asset: "Fundos Multimercado", percentage: 20 },
      { asset: "Renda Variável", percentage: 60 },
    ],
    icon: Rocket,
    color: "text-emerald-400",
  },
};

export function InvestorProfileQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (points: number) => {
    const newAnswers = [...answers, points];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResult(true);
    }
  };

  const calculateProfile = (): Profile => {
    const totalPoints = answers.reduce((sum, points) => sum + points, 0);
    const maxPoints = questions.length * 3;
    const percentage = (totalPoints / maxPoints) * 100;

    if (percentage <= 40) return "conservador";
    if (percentage <= 70) return "moderado";
    return "arrojado";
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResult(false);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (showResult) {
    const profile = profiles[calculateProfile()];
    const ProfileIcon = profile.icon;

    return (
      <ScaleIn className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-card border border-border mb-4 ${profile.color}`}
          >
            <ProfileIcon className="w-10 h-10" />
          </motion.div>
          <h3 className="text-2xl md:text-3xl font-serif text-foreground mb-2">
            {profile.title}
          </h3>
          <p className="text-muted-foreground">{profile.description}</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border mb-6"
        >
          <h4 className="font-semibold text-foreground mb-4 font-sans">
            Alocação Sugerida
          </h4>
          <div className="space-y-4">
            {profile.allocation.map((item, index) => (
              <motion.div
                key={item.asset}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground">{item.asset}</span>
                  <span className="font-semibold text-gold">
                    {item.percentage}%
                  </span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                    className="h-full bg-gradient-gold rounded-full"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="bg-secondary/50 rounded-xl p-6 border border-border mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Esta é uma sugestão genérica baseada nas suas respostas. Para uma
              estratégia personalizada considerando sua situação completa,
              agende uma consultoria com nosso assessor.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="gold" className="flex-1">
            Agendar Consultoria Personalizada
          </Button>
          <Button variant="outline" onClick={resetQuiz} className="flex-1 border-border hover:bg-secondary">
            <RotateCcw className="w-4 h-4 mr-2" />
            Refazer Quiz
          </Button>
        </div>
      </ScaleIn>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>
            Pergunta {currentQuestion + 1} de {questions.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center mb-8">
            <h3 className="text-xl md:text-2xl font-serif text-foreground">
              {question.question}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleAnswer(option.points)}
                className="w-full text-left p-5 rounded-xl border-2 border-border bg-card/50 hover:border-gold/50 hover:bg-gold/5 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium group-hover:text-gold transition-colors">
                    {option.text}
                  </span>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-gold group-hover:translate-x-1 transition-all" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
