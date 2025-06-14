
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Languages, Mic, Volume2, History, FileText, Mail, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function HelpPage() {
  const helpContent = {
    title: 'LinguaGhana Help Center',
    description: 'Find answers to common questions and learn how to use LinguaGhana effectively.',
    contactEmail: 'support@linguaghana.app', 

    sections: [
      {
        id: 'translation',
        icon: Languages,
        title: 'Text Translation',
        description: 'Translate text between English and supported Ghanaian languages like Twi, Ga, Dagbani, and Ewe.',
        faqs: [
          {
            q: 'How do I translate text?',
            a: '1. Go to the "Translator" page.\n2. Select your source and target languages.\n3. Type or paste your text into the input box.\n4. Click the "Translate" button. Your translation will appear in the output box.',
          },
          {
            q: 'Which languages are supported for translation?',
            a: 'Currently, LinguaGhana supports translation between English, Twi, Ga, Dagbani, and Ewe.',
          },
          {
            q: 'Is there a character limit for translation?',
            a: 'Yes, the input text for translation is typically limited to 1000 characters to ensure performance.',
          },
        ],
      },
      {
        id: 'summary',
        icon: FileText,
        title: 'AI Text Summarizer',
        description: 'Get concise summaries of long-form text content like articles, essays, or transcripts.',
        faqs: [
          {
            q: 'How do I summarize text?',
            a: '1. Navigate to the "Summarizer" page.\n2. Paste your long text into the input area.\n3. Select the language of the input text.\n4. Click "Summarize Text". The AI-generated summary will appear below.',
          },
          {
            q: 'What kind of text can I summarize?',
            a: 'You can summarize various types of content, including news articles, essays, reports, and even long transcripts.',
          },
          {
            q: 'Is there a limit to the text length for summarization?',
            a: 'Yes, for optimal performance and AI model constraints, input text is usually limited (e.g., to 5000 characters). The page will indicate the current limit.',
          },
        ],
      },
      {
        id: 'vot',
        icon: Mic,
        title: 'Voice-to-Text (Speech Recognition)',
        description: 'Convert spoken Ghanaian languages (currently Twi) into written text.',
        faqs: [
          {
            q: 'How do I use Voice-to-Text?',
            a: '1. Go to the "Voice-to-Text" page.\n2. Select the language you will be speaking (currently Twi is supported).\n3. Click the "Start Recording" button (you may need to grant microphone permission).\n4. Speak clearly.\n5. Click "Stop Recording". Your transcribed text will appear.',
          },
          {
            q: 'Which languages are supported for Voice-to-Text?',
            a: 'Currently, Twi is primarily supported for Voice-to-Text via the GhanaNLP API.',
          },
          {
            q: 'My browser says microphone access is not supported. What can I do?',
            a: 'Ensure you are using a modern browser like Chrome, Firefox, Edge, or Safari that supports the Web Speech API or MediaRecorder API. Also, check your browser settings to ensure microphone access is allowed for this site.',
          },
        ],
      },
      {
        id: 'tts',
        icon: Volume2,
        title: 'Text-to-Speech',
        description: 'Listen to written text spoken aloud in Twi or Ewe.',
        faqs: [
          {
            q: 'How do I use Text-to-Speech?',
            a: '1. Visit the "Text-to-Speech" page.\n2. Enter the text you want to hear into the text area.\n3. Select the desired language (Twi or Ewe) and a speaker voice.\n4. Click the "Synthesize" button. An audio player will appear to play the speech.',
          },
          {
            q: 'Which languages and voices are available?',
            a: 'Text-to-Speech currently supports Twi and Ewe, with various male and female speaker voices available for each, provided by the GhanaNLP API.',
          },
        ],
      },
      {
        id: 'history',
        icon: History,
        title: 'Activity History',
        description: 'Review your past translations, summaries, voice transcriptions, and text-to-speech activities.',
        faqs: [
          {
            q: 'How can I view my activity history?',
            a: 'Click on the "History" link in the sidebar. You can then switch between tabs for Translations, Summaries, Voice-to-Text, and Text-to-Speech activities.',
          },
          {
            q: 'Is my history private?',
            a: 'Yes, your activity history is stored securely and is only accessible by you when you are logged into your account. This is managed by Firestore security rules.',
          },
          {
            q: 'Can I delete my history?',
            a: 'Currently, direct deletion of history items from the interface is not supported. This feature may be added in the future.',
          },
        ],
      },
    ],
  };

  return (
    <div className="container mx-auto p-4 md:p-6 flex flex-col gap-4 md:gap-6">
      <div className="text-center md:text-left mb-4 md:mb-6">
        <h1 className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold flex items-center justify-center md:justify-start">
          <HelpCircle className="w-7 h-7 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-primary" />
          {helpContent.title}
        </h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm sm:text-base">{helpContent.description}</p>
      </div>

      {helpContent.sections.map((section) => (
        <Card key={section.id} id={section.id} className="card-animated">
          <CardHeader className="px-4 sm:px-6 pt-4 pb-2">
            <CardTitle className="flex items-center text-lg sm:text-xl md:text-2xl">
              <section.icon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-primary" />
              {section.title}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">{section.description}</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4">
            <Accordion type="single" collapsible className="w-full">
              {section.faqs.map((faq, index) => (
                <AccordionItem value={`${section.id}-item-${index}`} key={index}>
                  <AccordionTrigger className="text-left hover:no-underline text-sm md:text-base py-3">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs md:text-sm whitespace-pre-line pt-1 pb-3">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ))}

      <Card id="contact" className="card-animated mt-2">
        <CardHeader className="px-4 sm:px-6 pt-4 pb-2">
          <CardTitle className="flex items-center text-lg sm:text-xl md:text-2xl">
            <Mail className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-primary" />
            Contact & Feedback
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Have questions not answered here, or want to report an issue?
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4">
          <p className="text-sm text-muted-foreground mb-4">
            We value your feedback! If you encounter any problems, have suggestions, or need further assistance, please don&apos;t hesitate to reach out.
          </p>
          <Button asChild className="btn-animated w-full sm:w-auto">
            <a href={`mailto:${helpContent.contactEmail}?subject=LinguaGhana%20Feedback`}>
              <Mail className="mr-2 h-4 w-4" /> Email Support
            </a>
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            We typically respond within 1-2 business days.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
