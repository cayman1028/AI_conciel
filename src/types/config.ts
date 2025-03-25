export interface Question {
  id: string;
  text: string;
  answer: string;
}

export interface Category {
  id: string;
  title: string;
  questions: Question[];
}

export interface Questions {
  categories: Category[];
}

export interface Greeting {
  welcome: string;
  goodbye: string;
}

export interface Error {
  general: string;
  network: string;
}

export interface Chatbot {
  initial: string;
  thinking: string;
  notFound: string;
}

export interface Responses {
  greeting: Greeting;
  error: Error;
  chatbot: Chatbot;
  questions: Questions;
}

export interface Colors {
  primary: string;
  background: string;
  text: string;
  error: string;
  success: string;
}

export interface Typography {
  fontFamily: string;
  fontSize: {
    small: string;
    medium: string;
    large: string;
  };
}

export interface ChatWidget {
  buttonSize: string;
  borderRadius: string;
  boxShadow: string;
}

export interface Theme {
  colors: Colors;
  typography: Typography;
  chatWidget: ChatWidget;
  [key: string]: any;
} 