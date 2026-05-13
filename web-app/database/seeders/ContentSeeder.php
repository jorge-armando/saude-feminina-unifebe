<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Content;

class ContentSeeder extends Seeder
{
    public function run(): void
    {
        $contents = [
            [
                'title' => 'Corrimento Vaginal',
                'content' => '## Corrimentos vaginais, o que você deve saber sobre?

Durante o ciclo da mulher, o muco pode apresentar características diferentes, mas ainda assim, ser considerado normal.

### O que é normal?

- O muco fisiológico, normalmente é transparente ou claro, sem odor e não causa coceira.
- Durante o período fértil, é normal também o muco se tornar mais elástico e lubrificante, semelhante a clara de ovo (transparente, escorregadio e fluido), podendo puxá-lo em fio. Produz na vulva uma sensação de umidade e lubrificação.

### O que não é normal e você deve prestar atenção?

Existem algumas situações em que o muco vaginal torna-se diferente e, nesses casos, é necessário procurar sua UBS o mais rápido possível. Quando o corrimento apresentar características como:

- Coloração branca, aspecto grumoso, acompanhada de coceira intensa, ardor; ou
- Coloração amarelada ou esverdeada, com aspecto bolhoso e odor forte; ou
- Coloração acinzentada, odor fétido e que piora após relação sexual; ou
- Corrimento acompanhado de dor pélvica (dor na região inferior do abdome), associado a dor ou ardência ao urinar e/ou sangramento após a relação sexual.

### Resumindo, você deve procurar a Unidade Básica de Saúde sempre que houver:

- Corrimento com odor forte ou desagradável;
- Corrimento amarelado, esverdeado ou acinzentado;
- Coceira, ardor, dor durante ou após a relação sexual ou ao urinar.

**IMPORTANTE:** Gestante com qualquer tipo de alteração (precisa de avaliação mesmo que leve).

### O que você pode fazer em casa:

- Mantenha a higiene íntima com água e sabão neutro, sem duchas internas.
- Evite roupas muito apertadas e calcinhas com tecidos sintéticas.
- Prefira dormir sem calcinha para ventilação da região.
- Evite uso de protetores diários contínuos.

⚠️ **Essas informações não substituem avaliação médica. Procure sempre a UBS para confirmação e tratamento adequado.**',
                'tags' => 'corrimento,higiene-intima,saude-ginecologica',
                'reading_time' => 3,
            ],
            [
                'title' => 'Cólica Menstrual',
                'content' => '## Cólica

É uma dor na parte de baixo da barriga (abaixo do umbigo), comum em mulheres. É muito comum em jovens e adolescentes logo após a primeira menstruação. Porém, se você sentir dor forte ou cólicas intensas nessa região, é importante procurar a sua UBS para avaliação.

### De maneira geral, você deve procurar a Unidade Básica de Saúde sempre que houver:

- Febre; ou
- Se sentir dor muito forte; ou
- Em caso de sangramento intenso; ou
- Se houver suspeita ou confirmação de gravidez; ou
- Cólica intensa ou dor intensa à palpação; ou
- Se perceber manchas arroxeadas na pele.

### O que você pode fazer em casa:

Se não houver nenhum sintoma citado anteriormente, você pode:

- Fazer compressas de água morna na região inferior do abdômen.
- Praticar atividade física.
- Manter hidratação e alimentação saudável.

⚠️ **Essas informações não substituem avaliação médica. Procure sempre a UBS para avaliação e conduta adequada.**',
                'tags' => 'colica,dor-abdominal,menstruacao',
                'reading_time' => 2,
            ],
            [
                'title' => 'Atraso Menstrual',
                'content' => '## Atraso Menstrual

### Quando procurar a Unidade Básica de Saúde:

- Atraso de 15 dias ou mais, ou;
- Teste de gravidez positivo.

### O que você pode fazer em casa:

- Fazer um teste de gravidez se o atraso for maior que 15 dias. Anotar seus ciclos para observar um padrão.
- Evitar automedicação

⚠️ **Essas informações não substituem avaliação médica. Procure sempre a UBS para confirmação e acompanhamento.**',
                'tags' => 'atraso-menstrual,ciclo-menstrual,gravidez',
                'reading_time' => 2,
            ],
            [
                'title' => 'Sangramento Fora do Período Menstrual',
                'content' => '## Sangramento Fora do Período Menstrual

### O que você pode fazer em casa:

- Observar o volume e frequência do sangramento.
- Anotar se há relação com medicamentos ou início de métodos contraceptivos.
- Evitar relações sexuais até avaliação se o sangramento for repetido.
- Quanto tempo e quais dias você percebeu o sangramento?
- Sente mais alguma coisa além do sangramento? Exemplo: cólicas

⚠️ **Essas informações não substituem avaliação médica. Procure sempre a UBS para avaliação e exame físico se está com qualquer sangramento fora do período menstrual.**',
                'tags' => 'sangramento,ciclo-menstrual,emergencia',
                'reading_time' => 2,
            ],
            [
                'title' => 'Dor ou Ardor ao Urinar',
                'content' => '## Dor ou Ardor ao Urinar

### Sintomas associados:

- Sente urgência em urinar?
- Sente ardor ao urinar? apenas uma vez? após relação? mais de uma vez?
- Aumento da frequência urinária?
- Sente dor na região inferior do abdômen ou nas costas?
- Teve febre?

### Quando procurar a Unidade Básica de Saúde:

- Ardor persistente, dor abdominal intensa ou vontade frequente de urinar
- Presença de sangue na urina
- Febre, dor lombar ou calafrios

⚠️ **Essas informações não substituem avaliação médica. Procure sempre a UBS para confirmação e tratamento adequado.**',
                'tags' => 'infeccao-urinaria,ardor,dor',
                'reading_time' => 2,
            ],
            [
                'title' => 'Conheça Seu Ciclo Menstrual',
                'content' => '## Conheça Seu Ciclo Menstrual

O ciclo menstrual costuma variar entre **21 e 36 dias**, com sangramento de **3 a 7 dias**. É normal pequenas variações de duração e intensidade, especialmente em adolescentes, pós-parto e perto da menopausa.

### O que você pode fazer em casa:

- Anotar o ciclo menstrual (dia, duração, intensidade e sintomas).
- Fazer compressas mornas para aliviar cólicas.
- Manter hidratação e evitar excesso de café e sal durante o período.
- Procurar hábitos de relaxamento, como alongamento ou respiração profunda.',
                'tags' => 'ciclo-menstrual,educacao,saude-feminina',
                'reading_time' => 2,
            ],
            [
                'title' => 'Síndrome Pré-Menstrual (TPM) e Alterações Emocionais',
                'content' => '## Síndrome Pré-Menstrual (TPM) e Alterações Emocionais

Antes da menstruação, ocorre uma queda do hormônio estrogênio. Essa mudança pode influenciar substâncias do cérebro, como a serotonina e a dopamina, que estão relacionadas ao bem-estar e às emoções.

Por isso, algumas mulheres podem sentir irritação, tristeza, sensibilidade maior ou mudanças de humor nesse período. Mas é importante lembrar que nem todas vão sentir os mesmos sintomas, e eles não acontecem apenas por causa da menstruação. Fatores como estresse, rotina, alimentação, sono e situações pessoais também influenciam bastante.

Manter uma alimentação equilibrada, praticar atividade física, dormir bem e evitar excesso de álcool e cigarro são atitudes que ajudam a diminuir esses sintomas e contribuem para o seu bem-estar geral.

### O que você pode fazer em casa:

- Fazer pequenas refeições equilibradas e praticar exercícios leves.
- Reduzir o consumo de álcool e cafeína.
- Reservar momentos de descanso e lazer.
- Buscar apoio psicológico se sentir sobrecarga emocional.',
                'tags' => 'tpm,saude-mental,hormonios',
                'reading_time' => 3,
            ],
            [
                'title' => 'Prevenção e Rastreio do Câncer de Colo do Útero',
                'content' => '## Prevenção e Rastreio do Câncer de Colo do Útero

### O que é normal:

Fazer o exame preventivo (Papanicolau) regularmente faz parte do cuidado com a saúde da mulher. Ele ajuda a identificar alterações antes que virem câncer.

Se você tem entre 25 e 64 anos, independentemente da orientação sexual, incluindo mulheres que fazem sexo com outras mulheres que já tenham tido penetração (grupo que menos se submete ao exame) e homens trans, você deve procurar a UBS para realizar o exame. O rastreamento deve ser realizado a partir de 25 anos em todas as mulheres que iniciaram atividade sexual.

**Ficou em dúvida? Procure a sua Unidade Básica de Saúde de referência!**

### Quando procurar a Unidade Básica de Saúde:

- Se nunca fez o exame preventivo (Papanicolau).
- Se está há mais de 1 ano sem realizar o exame.
- Se apresenta sangramento fora do período menstrual ou após relação.
- Se tem corrimento persistente com cheiro forte ou diferente do habitual.
- Se sente dor pélvica frequente sem causa conhecida.

### O que você pode fazer em casa:

- Manter os exames preventivos em dia (conforme orientação da UBS).
- Usar preservativo nas relações sexuais.
- Tomar a vacina contra HPV (quando indicada).
- Evitar o tabagismo.
- Procurar a UBS regularmente para acompanhamento.
- Manter um estilo de vida saudável.',
                'tags' => 'prevencao,cancer,papanicolau,hpv',
                'reading_time' => 4,
            ],
            [
                'title' => 'Prevenção e Rastreio do Câncer de Mama',
                'content' => '## Prevenção e Rastreio do Câncer de Mama

### O que é normal:

Realizar exames de rotina e observar as mamas faz parte do autocuidado e ajuda na detecção precoce.

### Quando procurar a Unidade Básica de Saúde:

- Se notar caroço (nódulo) na mama ou na axila.
- Se perceber secreção pelo mamilo.
- Se houver retração da pele ou do mamilo.
- Se perceber pele com aspecto de casca de laranja.
- Se observar vermelhidão, inchaço ou mudança no formato da mama.
- Se nunca realizou mamografia (a partir dos 40 anos ou antes, se indicado).
- Se houver histórico familiar de câncer de mama.
- Se dor em uma ou ambas mamas.

### O que você pode fazer em casa:

- Observar suas mamas mensalmente, prestando atenção às mudanças.
- Agendar mamografia conforme orientação da UBS.
- Evitar tabagismo, excesso de álcool e sedentarismo.
- Manter alimentação saudável, rica em frutas, verduras e fibras.
- Frequentar a UBS regularmente para acompanhamento.
- Realizar atividades físicas regularmente.',
                'tags' => 'prevencao,cancer,mama,mamografia',
                'reading_time' => 3,
            ],
            [
                'title' => 'Violência Contra a Mulher',
                'content' => '## Violência Contra a Mulher

A violência contra a mulher é qualquer atitude ou comportamento motivado pelo fato de ela ser mulher que provoque morte, dor, sofrimento ou prejuízo físico, sexual ou emocional.

Isso pode acontecer tanto em espaços públicos (como na rua ou no trabalho) quanto dentro de casa, no ambiente familiar ou em um relacionamento.

### Quando procurar ajuda:

- Se sentir medo, vergonha, culpa ou estiver sendo ameaçada.
- Se houver agressões físicas, sexuais ou controle de sua rotina.
- Se precisar de apoio para sair de uma relação abusiva.

### O que você pode fazer:

- Buscar atendimento na UBS, CRAS, CREAS ou Delegacia da Mulher.
- Ligar para o **180 (Central de Atendimento à Mulher)** – gratuito e sigiloso.
- Utilizar o Violentômetro para identificar sinais de abuso.
- Pedir ajuda a alguém de confiança e não se isolar.

**Referência:** Lei nº 11.340/2006 (Lei Maria da Penha)',
                'tags' => 'violencia,lei-maria-da-penha,ajuda-emergencial',
                'reading_time' => 3,
            ],
            [
                'title' => 'Climatério e Menopausa',
                'content' => '## Climatério e Menopausa

### O que é normal:

O climatério é a fase da vida da mulher em que o corpo está passando da etapa reprodutiva (em que pode engravidar) para a etapa não reprodutiva. Essa transição costuma acontecer, em geral, entre os 40 e 65 anos de idade.

A menopausa é um marco importante dentro do climatério. Ela significa a parada definitiva da menstruação. O diagnóstico só pode ser confirmado depois que a mulher fica 12 meses seguidos sem menstruar, sem outra causa para isso. Geralmente, a menopausa acontece entre os 48 e 50 anos de idade.

### Sintomas comuns:

- Ondas de calor (fogachos)
- Suores noturnos
- Alterações do sono
- Irritabilidade
- Ansiedade
- Oscilações de humor
- Irregularidade menstrual (na transição)
- Diminuição da libido
- Ressecamento vaginal
- Dor na relação sexual
- Ardor ou coceira vaginal
- Urgência urinária
- Infecções urinárias recorrentes
- Ganho de peso
- Diminuição da massa óssea (osteopenia/osteoporose)

### Quando procurar a Unidade Básica de Saúde:

- Ao perceber os primeiros sinais e sintomas; ou
- Sintomas intensos que afetam o sono ou a qualidade de vida;
- Sangramento após 1 ano sem menstruar;
- Dor durante relações sexuais;
- Qualquer sintoma citado acima; ou
- Quando estiver na faixa etária indicada.

### O que você pode fazer em casa:

#### Em caso de fogachos e suores noturnos:

- Dormir em ambiente bem ventilado;
- Usar roupas em camadas que possam ser facilmente retiradas;
- Usar tecidos que deixem a pele "respirar";
- Beber um copo de água ou suco quando perceber a chegada deles;
- Não fumar, evitar consumo de bebidas alcoólicas e de cafeína;
- Ter um diário para anotar os momentos em que o fogacho se inicia;
- Praticar atividade física;
- Perder peso, caso haja excesso de peso;
- Respirar lenta e profundamente por alguns minutos.

#### Em caso de problemas para dormir:

- Diminuir a tomada de líquidos antes da hora de dormir;
- Praticar atividades físicas na maior parte dos dias, mas nunca a partir de três horas antes de ir dormir;
- Deitar-se e levantar-se sempre nos mesmos horários;
- Escolher uma atividade prazerosa diária para a hora de se deitar;
- Assegurar que a cama e o quarto de dormir estejam confortáveis;
- Não fazer nenhuma refeição pesada antes de se deitar;
- Experimentar uma respiração lenta e profunda.

#### De maneira geral:

- Manter uma alimentação saudável e hidratação adequada;
- Praticar atividade física regularmente;
- Evitar cigarro e excesso de álcool;
- Buscar orientação sobre terapia hormonal, se necessário;
- Procurar adquirir mais informações sobre esse processo natural;
- Considerar o uso de lubrificantes vaginais durante a relação sexual.',
                'tags' => 'climaterio,menopausa,hormonios,idade-madura',
                'reading_time' => 5,
            ],
            [
                'title' => 'Autocuidado e Hábitos Saudáveis',
                'content' => '## Autocuidado e Hábitos Saudáveis

### O que é normal:

Cuidar da saúde é um ato de amor-próprio e deve fazer parte do cotidiano.

### O que você pode fazer em casa:

- Ter rotina de sono regular e alimentação equilibrada.
- Praticar atividade física pelo menos 3x por semana.
- Fazer autoexame das mamas para conhecer seu próprio corpo e exames preventivos.
- Separar momentos de lazer e relaxamento.
- Evitar uso abusivo de álcool, cigarro e automedicação.

### Quando procurar a Unidade Básica de Saúde:

- Para acompanhamento regular, vacinação, planejamento familiar, suporte emocional ou sempre que você precisar :)',
                'tags' => 'autocuidado,prevencao,saude-geral,bem-estar',
                'reading_time' => 2,
            ],
        ];

        foreach ($contents as $content) {
            Content::create($content);
        }
    }
}
