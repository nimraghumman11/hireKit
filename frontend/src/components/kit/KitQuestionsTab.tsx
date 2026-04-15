import BehavioralQuestionsTab from '@/components/kit/BehavioralQuestionsTab';
import TechnicalQuestionsTab from '@/components/kit/TechnicalQuestionsTab';
import type { BehavioralQuestion, TechnicalQuestion } from '@/types/kit.types';

interface Props {
  behavioralQuestions: BehavioralQuestion[];
  technicalQuestions: TechnicalQuestion[];
}

export default function KitQuestionsTab({ behavioralQuestions, technicalQuestions }: Props) {
  return (
    <div className="space-y-10">
      <section>
        <h3 className="mb-6 border-l-4 border-indigo-500 pl-3 text-lg font-bold text-slate-900 dark:border-cyan-400 dark:text-white">
          Behavioral questions
        </h3>
        <BehavioralQuestionsTab questions={behavioralQuestions} />
      </section>
      <section>
        <h3 className="mb-6 border-l-4 border-teal-500 pl-3 text-lg font-bold text-slate-900 dark:border-teal-400 dark:text-white">
          Technical questions
        </h3>
        <TechnicalQuestionsTab questions={technicalQuestions} />
      </section>
    </div>
  );
}
