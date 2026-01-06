export interface EndpointMethod {
  name: string;
  description: string;
  endpoint: string;
}

export interface EndpointCategory {
  category: string;
  description: string;
  icon: React.ReactNode;
  methods: EndpointMethod[];
}

export interface TestResult {
  success: boolean;
  rawResponse?: any;
  data?: any;
  error?: string;
  timestamp: string;
  responseTime: number;
}

export interface EndpointStats {
  totalMethods: number;
  successfulTests: number;
  failedTests: number;
  avgResponseTime: number;
}
