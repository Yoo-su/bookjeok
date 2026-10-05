// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import sharedConfig from '../../eslint.config.mjs';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  ...sharedConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // 체크리스트 3·9번과 의존 방향을 자동 검사
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@bookjeok/api-client',
              message: '서버는 core만 공유합니다.',
            },
            {
              name: '@bookjeok/react-query',
              message: '서버는 core만 공유합니다.',
            },
          ],
          patterns: [
            {
              regex: '^\\.\\./\\.\\./',
              message: '@/features/... · @/shared/... 별칭을 사용하세요.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'NewExpression[callee.name=/^(HttpException|BadRequestException|UnauthorizedException|ForbiddenException|NotFoundException|ConflictException|UnprocessableEntityException|InternalServerErrorException|ServiceUnavailableException)$/]',
          message:
            'ERROR_CODES에 코드를 등록하고 BusinessException을 던지세요.',
        },
      ],
    },
  },
);
