<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Conversation;
use App\Entity\Message;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @method Message|null find($id, $lockMode = null, $lockVersion = null)
 * @method Message|null findOneBy(array $criteria, array $orderBy = null)
 * @method Message[]    findAll()
 * @method Message[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class MessageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Message::class);
    }

    public function findLastMessages(Conversation $conv, int $limit = 0, int $offset = 0): array
    {
        $qb = $this->createQueryBuilder('m');
        $qb->where('m.conversation = :conv')->setParameter('conv', $conv);
        if ($offset > 0) {
            $qb->setFirstResult($offset);
        }
        if ($limit > 0) {
            $qb->setMaxResults($limit);
        }
        $qb->orderBy('m.id', 'DESC');

        return $qb->getQuery()->getResult();
    }

    public function countMessages(Conversation $conv): string
    {
        $qb = $this->createQueryBuilder('m');
        $qb->where('m.conversation = :conv')->setParameter('conv', $conv);
        $qb->select('count(m.id)');

        return $qb->getQuery()->getSingleScalarResult();
    }
}