
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Languages, Mic, Volume2, History, FileText, Mail, HelpCircle } from 'lucide-react';

export default function HelpPage() {
  const helpContent = {
    title: 'Polyglot Help Center',
    description: 'Find answers to common questions and learn how to use Polyglot effectively.',
    contactEmail: 'support@polyglot.app',

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
            a: 'Currently, Polyglot supports translation between English, Twi, Ga, Dagbani, and Ewe.',
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
            a: 'Click on the "History" link in the header. You can then switch between tabs for Translations, Summaries, Voice-to-Text, and Text-to-Speech activities.',
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
    <div className="container mx-auto max-w-4xl p-4 md:p-6 space-y-8 md:space-y-12">
      <header className="text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold flex items-center justify-center gap-3">
          <HelpCircle className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
          {helpContent.title}
        </h1>
        <p className="text-muted-foreground mt-2 text-base sm:text-lg">{helpContent.description}</p>
      </header>

      {helpContent.sections.map((section) => (
        <section key={section.id} id={section.id} className="p-6 rounded-lg border bg-muted/20">
          <h2 className="text-2xl font-bold flex items-center mb-4">
            <section.icon className="w-7 h-7 mr-3 text-primary" />
            {section.title}
          </h2>
          <p className="text-muted-foreground mb-4">{section.description}</p>
          <Accordion type="single" collapsible className="w-full">
            {section.faqs.map((faq, index) => (
              <AccordionItem value={`${section.id}-item-${index}`} key={index}>
                <AccordionTrigger className="text-left hover:no-underline text-base py-3">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm whitespace-pre-line pt-1 pb-3">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ))}

      <section id="contact" className="text-center p-6 rounded-lg border bg-muted/20">
        <h2 className="text-2xl font-bold flex items-center justify-center mb-4">
            <Mail className="w-7 h-7 mr-3 text-primary" />
            Still Need Help?
        </h2>
        <p className="text-muted-foreground mb-4 max-w-2xl mx-auto">
          If you couldn't find your answer, please don't hesitate to reach out to our support team.
        </p>
        <Button asChild className="btn-animated">
          <a href={`mailto:${helpContent.contactEmail}?subject=Polyglot%20Feedback`}>
            <Mail className="mr-2 h-4 w-4" /> Email Support
          </a>
        </Button>
      </section>
    </div>
  );
}
