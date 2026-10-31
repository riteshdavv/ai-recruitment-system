import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { InterviewType } from '@/services/Constants';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import { ArrowRight } from 'lucide-react';

function FormContainer({ onHandleInputChange, GoToNext }) {
  const [interviewType, setInterviewType] = useState([]);

  useEffect(() => {
    if (interviewType) {
      onHandleInputChange('type', interviewType);
    }
  }, [interviewType]);

  const AddInterviewType = (name) => {
    const exists = interviewType.includes(name);
    if (!exists) {
      setInterviewType(prev => [...prev, name]);
    } else {
      setInterviewType(prev => prev.filter(item => item !== name));
    }
  };

  return (
    <div className="bg-surface rounded-lg border border-line p-6 shadow-card space-y-5">
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">
          Job Position / Title
        </label>
        <Input
          placeholder="e.g. Senior Frontend Engineer"
          onChange={(e) => onHandleInputChange('jobPosition', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">
          Job Description & Requirements
        </label>
        <Textarea
          placeholder="Paste key responsibilities, required skills, and qualifications for the AI interviewer to assess..."
          className="min-h-[160px]"
          onChange={(e) => onHandleInputChange('jobDescription', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">
          Expected Interview Duration
        </label>
        <Select onValueChange={(val) => onHandleInputChange('duration', val)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select target duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5 Min">5 Minutes (Quick Screening)</SelectItem>
            <SelectItem value="15 Min">15 Minutes (Standard Screening)</SelectItem>
            <SelectItem value="30 Min">30 Minutes (Comprehensive)</SelectItem>
            <SelectItem value="45 Min">45 Minutes (Deep Dive)</SelectItem>
            <SelectItem value="60 Min">60 Minutes (Full Technical)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-2">
          Interview Evaluation Focus (Select multiple)
        </label>
        <div className="flex gap-2 flex-wrap">
          {InterviewType.map((type, index) => {
            const isSelected = interviewType.includes(type.name);
            return (
              <button
                key={index}
                type="button"
                className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  isSelected
                    ? 'bg-sage-100 text-sage-900 border-sage-700 font-semibold'
                    : 'bg-surface text-ink-muted border-line hover:bg-sage-50 hover:text-ink'
                }`}
                onClick={() => AddInterviewType(type.name)}
              >
                <type.icon className={`h-3.5 w-3.5 ${isSelected ? 'text-sage-700' : 'text-ink-muted'}`} strokeWidth={1.75} />
                <span>{type.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-4 border-t border-line flex justify-end">
        <Button
          onClick={GoToNext}
          className="bg-sage-700 hover:bg-sage-800 text-white font-medium"
        >
          <span>Generate Question Plan</span>
          <ArrowRight className="w-4 h-4 ml-1.5" strokeWidth={2} />
        </Button>
      </div>
    </div>
  );
}

export default FormContainer;
