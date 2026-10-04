import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
  Subscription,
  finalize,
  timeout
} from 'rxjs';

import {
  Header
} from '../../components/header/header';

import {
  ApiService
} from '../../core/services/api';


// =========================================================
// RESPONSE PRESENTATION
// =========================================================

interface InlinePart {
  kind: 'text' | 'strong' | 'code';
  text: string;
}

interface AnswerListItem {
  marker: string;
  depth: number;
  parts: InlinePart[];
}

type AnswerBlock =
  | {
      kind: 'paragraph' | 'quote';
      parts: InlinePart[];
    }
  | {
      kind: 'list';
      items: AnswerListItem[];
    }
  | {
      kind: 'table';
      headers: InlinePart[][];
      rows: InlinePart[][][];
    }
  | {
      kind: 'code';
      language: string;
      text: string;
    }
  | {
      kind: 'divider';
    };

interface AnswerSection {
  title: InlinePart[];
  blocks: AnswerBlock[];
  wide: boolean;
}


@Component({
  selector: 'app-ai',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    Header
  ],

  templateUrl: './ai.html',
  styleUrl: './ai.scss',

  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Ai {

  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  private request?: Subscription;
  private copyTimer?: ReturnType<typeof setTimeout>;

  @ViewChild('questionInput')
  private questionInput?: ElementRef<HTMLTextAreaElement>;


  // =======================================================
  // STATE
  // =======================================================

  readonly question = signal('');
  readonly submittedQuestion = signal('');

  readonly answer = signal('');
  readonly loading = signal(false);

  readonly error = signal('');
  readonly notice = signal('');

  readonly answeredAt = signal<Date | null>(null);

  readonly copyState =
    signal<'idle' | 'copied' | 'error'>('idle');


  // =======================================================
  // QUICK QUESTIONS
  // =======================================================

  readonly quickQuestions = [
    {
      title: 'Planear una reposición',
      description: 'Revisa qué productos conviene reabastecer.',
      question: '¿Qué producto debería reabastecer?',
      icon: 'box'
    },
    {
      title: 'Conocer lo más vendido',
      description: 'Identifica el producto con más ventas.',
      question: '¿Cuál es el producto más vendido?',
      icon: 'trend'
    },
    {
      title: 'Detectar stock bajo',
      description: 'Consulta los productos con pocas unidades.',
      question: '¿Qué productos tienen poco stock?',
      icon: 'stock'
    },
    {
      title: 'Revisar el inventario',
      description: 'Obtén una visión general de tus productos.',
      question: '¿Cómo está el inventario?',
      icon: 'grid'
    }
  ];


  // =======================================================
  // COMPUTED
  // =======================================================

  readonly canAnalyze = computed(() =>
    this.question().trim().length > 0 &&
    !this.loading()
  );

  readonly hasContent = computed(() =>
    Boolean(
      this.question() ||
      this.answer() ||
      this.error() ||
      this.notice()
    )
  );

  readonly answerSections = computed(() =>
    this.parseAnswer(this.answer())
  );


  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.copyTimer) {
        clearTimeout(this.copyTimer);
      }
    });
  }


  // =======================================================
  // ANALYZE
  // =======================================================

  analyze(): void {
    if (this.loading()) {
      return;
    }

    const question = this.question().trim();

    if (!question) {
      this.error.set(
        'Escribe una pregunta antes de analizar.'
      );

      this.focusInput();
      return;
    }

    this.resetCopyState();

    this.submittedQuestion.set(question);

    this.answer.set('');
    this.answeredAt.set(null);

    this.error.set('');
    this.notice.set('');
    this.loading.set(true);

    this.request = this.api
      .analyzeWithAI(question)
      .pipe(
        timeout(120000),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: response => {
          const answer =
            typeof response?.answer === 'string'
              ? response.answer.trim()
              : '';

          if (!answer) {
            this.error.set(
              'La consulta terminó sin una respuesta. Intenta reformular tu pregunta.'
            );
            return;
          }

          this.answer.set(answer);
          this.answeredAt.set(new Date());
        },

        error: error => {
          this.error.set(
            this.getErrorMessage(error)
          );
        }
      });
  }


  askQuickQuestion(question: string): void {
    if (this.loading()) {
      return;
    }

    this.question.set(question);
    this.analyze();
  }


  onShortcut(event: Event): void {
    event.preventDefault();
    this.analyze();
  }


  // =======================================================
  // CANCEL / CLEAR
  // =======================================================

  cancel(): void {
    if (!this.loading()) {
      return;
    }

    // Cancela la suscripción para que una respuesta tardía
    // no vuelva a escribir en la pantalla.
    this.request?.unsubscribe();
    this.request = undefined;

    this.loading.set(false);

    this.notice.set(
      'Consulta detenida. Puedes editar la pregunta y volver a enviarla.'
    );

    this.focusInput();
  }


  clear(): void {
    this.request?.unsubscribe();
    this.request = undefined;

    this.loading.set(false);

    this.question.set('');
    this.submittedQuestion.set('');
    this.answer.set('');

    this.error.set('');
    this.notice.set('');
    this.answeredAt.set(null);

    this.resetCopyState();
    this.focusInput();
  }


  private focusInput(): void {
    this.questionInput?.nativeElement.focus();
  }


  // =======================================================
  // COPY
  // =======================================================

  async copyAnswer(): Promise<void> {
    const answer = this.answer();

    if (!answer) {
      return;
    }

    this.resetCopyState();

    try {
      if (
        typeof navigator === 'undefined' ||
        !navigator.clipboard?.writeText
      ) {
        throw new Error('Clipboard unavailable');
      }

      await navigator.clipboard.writeText(answer);

      if (
        this.destroyRef.destroyed ||
        this.answer() !== answer
      ) {
        return;
      }

      this.copyState.set('copied');

      this.copyTimer = setTimeout(() => {
        this.copyState.set('idle');
      }, 2500);

    } catch {
      if (
        !this.destroyRef.destroyed &&
        this.answer() === answer
      ) {
        this.copyState.set('error');
      }
    }
  }


  private resetCopyState(): void {
    if (this.copyTimer) {
      clearTimeout(this.copyTimer);
      this.copyTimer = undefined;
    }

    this.copyState.set('idle');
  }


  // =======================================================
  // SAFE RESPONSE FORMATTING
  //
  // Renderiza texto mediante interpolación de Angular.
  // No inserta HTML recibido de la API.
  // =======================================================

  private inline(text: string): InlinePart[] {
    const parts: InlinePart[] = [];

    const pattern = /`([^`\n]+)`|\*\*([^*\n]+)\*\*/g;

    let previousIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > previousIndex) {
        parts.push({
          kind: 'text',
          text: text.slice(previousIndex, match.index)
        });
      }

      parts.push({
        kind: match[1] !== undefined ? 'code' : 'strong',
        text: match[1] ?? match[2]
      });

      previousIndex = pattern.lastIndex;
    }

    if (previousIndex < text.length) {
      parts.push({
        kind: 'text',
        text: text.slice(previousIndex)
      });
    }

    return parts;
  }


  private tableCells(line: string): string[] {
    let text = line.trim();

    if (text.startsWith('|')) {
      text = text.slice(1);
    }

    if (text.endsWith('|') && !text.endsWith('\\|')) {
      text = text.slice(0, -1);
    }

    return text
      .split(/(?<!\\)\|/)
      .map(cell =>
        cell.trim().replace(/\\\|/g, '|')
      );
  }


  private isTableStart(
    lines: string[],
    index: number
  ): boolean {
    if (
      index + 1 >= lines.length ||
      !lines[index].includes('|')
    ) {
      return false;
    }

    const headers = this.tableCells(lines[index]);
    const separators = this.tableCells(lines[index + 1]);

    return (
      headers.length > 0 &&
      headers.length === separators.length &&
      separators.every(cell => /^:?-{3,}:?$/.test(cell))
    );
  }


  private isBlockStart(
    lines: string[],
    index: number
  ): boolean {
    const line = lines[index];

    return (
      /^\s*(`{3,}|~{3,})/.test(line) ||
      /^\s{0,3}#{1,6}\s+/.test(line) ||
      /^\s*([-+*]|\d+[.)])\s+/.test(line) ||
      /^\s*>/.test(line) ||
      /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line) ||
      this.isTableStart(lines, index)
    );
  }


  private parseAnswer(text: string): AnswerSection[] {
    if (!text.trim()) {
      return [];
    }

    const lines = text.replace(/\r\n?/g, '\n').split('\n');

    const sections: AnswerSection[] = [];

    let current: AnswerSection = {
      title: [],
      blocks: [],
      wide: false
    };

    sections.push(current);

    let index = 0;

    while (index < lines.length) {
      const line = lines[index];

      if (!line.trim()) {
        index++;
        continue;
      }


      // BLOQUES DE CÓDIGO

      const fence = line.match(
        /^\s*(`{3,}|~{3,})(.*)$/
      );

      if (fence) {
        const marker = fence[1];
        const content: string[] = [];

        index++;

        while (index < lines.length) {
          const closing = lines[index].trim();

          const closesFence =
            closing.length >= marker.length &&
            [...closing].every(char => char === marker[0]);

          if (closesFence) {
            index++;
            break;
          }

          content.push(lines[index]);
          index++;
        }

        current.blocks.push({
          kind: 'code',
          language: fence[2].trim(),
          text: content.join('\n')
        });

        current.wide = true;
        continue;
      }


      // TÍTULOS: CADA SECCIÓN SE CONVIERTE EN UNA TARJETA

      const heading = line.match(
        /^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/
      );

      if (heading) {
        if (current.title.length || current.blocks.length) {
          current = {
            title: [],
            blocks: [],
            wide: false
          };

          sections.push(current);
        }

        current.title = this.inline(heading[1]);
        index++;
        continue;
      }


      // TABLAS

      if (this.isTableStart(lines, index)) {
        const headers = this.tableCells(lines[index]);

        const rows: InlinePart[][][] = [];

        index += 2;

        while (
          index < lines.length &&
          lines[index].trim() &&
          lines[index].includes('|')
        ) {
          const cells = this.tableCells(lines[index]);

          if (cells.length !== headers.length) {
            break;
          }

          rows.push(
            cells.map(cell => this.inline(cell))
          );

          index++;
        }

        current.blocks.push({
          kind: 'table',
          headers: headers.map(header => this.inline(header)),
          rows
        });

        current.wide = true;
        continue;
      }


      // SEPARADORES

      if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
        current.blocks.push({ kind: 'divider' });
        index++;
        continue;
      }


      // LISTAS

      if (/^\s*([-+*]|\d+[.)])\s+/.test(line)) {
        const items: AnswerListItem[] = [];

        while (index < lines.length) {
          const item = lines[index].match(
            /^(\s*)([-+*]|\d+[.)])\s+(.+)$/
          );

          if (!item) {
            break;
          }

          const content = [item[3]];
          index++;

          // Conserva continuaciones indentadas del mismo elemento.
          while (
            index < lines.length &&
            /^\s{2,}\S/.test(lines[index]) &&
            !this.isBlockStart(lines, index)
          ) {
            content.push(lines[index].trim());
            index++;
          }

          items.push({
            marker: /^\d/.test(item[2]) ? item[2] : '•',
            depth: Math.min(
              4,
              Math.floor(
                item[1].replace(/\t/g, '  ').length / 2
              )
            ),
            parts: this.inline(content.join('\n'))
          });
        }

        current.blocks.push({
          kind: 'list',
          items
        });

        continue;
      }


      // CITAS / NOTAS

      if (/^\s*>/.test(line)) {
        const content: string[] = [];

        while (
          index < lines.length &&
          /^\s*>/.test(lines[index])
        ) {
          content.push(
            lines[index].replace(/^\s*>\s?/, '')
          );

          index++;
        }

        current.blocks.push({
          kind: 'quote',
          parts: this.inline(content.join('\n'))
        });

        continue;
      }


      // PÁRRAFOS

      const paragraph = [line];
      index++;

      while (
        index < lines.length &&
        lines[index].trim() &&
        !this.isBlockStart(lines, index)
      ) {
        paragraph.push(lines[index]);
        index++;
      }

      const paragraphText = paragraph.join('\n');

      current.blocks.push({
        kind: 'paragraph',
        parts: this.inline(paragraphText)
      });

      if (paragraphText.length > 700) {
        current.wide = true;
      }
    }

    const result = sections.filter(section =>
      section.title.length || section.blocks.length
    );

    if (result.length === 1) {
      result[0].wide = true;
    }

    return result;
  }


  // =======================================================
  // ERROR
  // =======================================================

  private getErrorMessage(error: unknown): string {
    const response = error as {
      name?: string;
      status?: number;
      error?: {
        detail?: unknown;
        message?: unknown;
      };
    };

    if (response?.name === 'TimeoutError') {
      return 'La respuesta tardó demasiado. Puedes intentar una pregunta más específica.';
    }

    if (response?.status === 0) {
      return 'No se pudo conectar con el servidor. Intenta nuevamente.';
    }

    const detail = response?.error?.detail;

    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }

    if (Array.isArray(detail)) {
      const messages = detail
        .map(item => {
          if (
            item &&
            typeof item === 'object' &&
            'msg' in item
          ) {
            return String(item.msg);
          }

          return '';
        })
        .filter(Boolean);

      if (messages.length) {
        return messages.join(' ');
      }
    }

    const message = response?.error?.message;

    return typeof message === 'string' && message.trim()
      ? message
      : 'No fue posible obtener una respuesta de Collectify AI.';
  }
}